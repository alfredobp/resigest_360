-- ==============================================================================
-- RESIGEST 360 - BLOQUE 6: CIERRES DE SEGURIDAD, ESQUEMA SQL Y CUMPLIMIENTO
-- 1. Cierre de RLS cruzada en sira_submissions y audit_logs (+ constraint entidad)
-- 2. Columnas faltantes en waste_contracts (frecuencia_recogida, firmado_*)
--    y actualización de sign_contract_by_signing_token
-- 3. RLS de consultoría (has_company_access / has_company_write_access) en
--    memorias_anuales, prior_notifications, environmental_authorizations,
--    treatment_managers y carriers
-- 4. Bloqueo RLS de borrado < 5 años en chronological_registry (Art. 64 Ley 7/2022)
-- 5. Caducidad de 7 días en get_deca_by_token (Ley 9/2025 / Orden FOM/2861/2012)
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. public.sira_submissions: eliminar política abierta y aislar por tenant
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.sira_submissions') IS NOT NULL THEN
    DROP POLICY IF EXISTS "sira_submissions_all_authenticated" ON public.sira_submissions;
    DROP POLICY IF EXISTS "sira_submissions_select_tenant" ON public.sira_submissions;
    DROP POLICY IF EXISTS "sira_submissions_insert_tenant" ON public.sira_submissions;
    DROP POLICY IF EXISTS "sira_submissions_update_tenant" ON public.sira_submissions;
    DROP POLICY IF EXISTS "sira_submissions_delete_admin" ON public.sira_submissions;

    CREATE POLICY "sira_submissions_select_tenant" ON public.sira_submissions
      FOR SELECT USING (
        auth.uid() = user_id
        OR public.has_company_access(company_id)
        OR public.is_admin()
      );

    CREATE POLICY "sira_submissions_insert_tenant" ON public.sira_submissions
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    CREATE POLICY "sira_submissions_update_tenant" ON public.sira_submissions
      FOR UPDATE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      )
      WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    CREATE POLICY "sira_submissions_delete_admin" ON public.sira_submissions
      FOR DELETE USING (public.is_admin());
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 2. public.waste_contracts: periodicidad y flags de firma + RPC pública
-- ------------------------------------------------------------------------------
ALTER TABLE public.waste_contracts
  ADD COLUMN IF NOT EXISTS frecuencia_recogida TEXT,
  ADD COLUMN IF NOT EXISTS firmado_productor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS firmado_gestor BOOLEAN DEFAULT FALSE;

UPDATE public.waste_contracts
   SET firmado_productor = TRUE
 WHERE firma_productor_url IS NOT NULL
   AND COALESCE(firmado_productor, FALSE) = FALSE;

UPDATE public.waste_contracts
   SET firmado_gestor = TRUE
 WHERE firma_gestor_url IS NOT NULL
   AND COALESCE(firmado_gestor, FALSE) = FALSE;

CREATE OR REPLACE FUNCTION public.sign_contract_by_signing_token(
    p_token UUID,
    p_role TEXT,
    p_signature_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id BIGINT;
BEGIN
    IF p_role NOT IN ('productor', 'gestor') THEN
        RAISE EXCEPTION 'Rol de firma inválido';
    END IF;

    SELECT id INTO v_id
      FROM public.waste_contracts
     WHERE signing_token = p_token
       AND (signing_token_expires_at IS NULL OR signing_token_expires_at > now())
     LIMIT 1;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'Contrato no encontrado o token inválido';
    END IF;

    IF p_role = 'productor' THEN
        UPDATE public.waste_contracts
           SET firma_productor_url = p_signature_url,
               fecha_firma_productor = now(),
               firmado_productor = TRUE
         WHERE id = v_id AND firma_productor_url IS NULL;
    ELSE
        UPDATE public.waste_contracts
           SET firma_gestor_url = p_signature_url,
               fecha_firma_gestor = now(),
               firmado_gestor = TRUE
         WHERE id = v_id AND firma_gestor_url IS NULL;
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El contrato ya fue firmado por este rol';
    END IF;

    RETURN public.get_contract_by_signing_token(p_token);
END;
$$;

REVOKE ALL ON FUNCTION public.sign_contract_by_signing_token(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sign_contract_by_signing_token(UUID, TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 3. public.audit_logs: constraint de entidad y RLS estricto por tenant
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    ALTER TABLE public.audit_logs
      DROP CONSTRAINT IF EXISTS audit_logs_entidad_check;

    ALTER TABLE public.audit_logs
      ADD CONSTRAINT audit_logs_entidad_check CHECK (
        entidad IN (
          'di',
          'contrato',
          'operacion_comercial',
          'empresa',
          'centro_produccion',
          'archivo_cronologico',
          'memoria_anual',
          'autorizacion',
          'deca',
          'notificacion_previa',
          'integracion_sira',
          'integracion_holded'
        )
      );

    DROP POLICY IF EXISTS "audit_logs_select_authenticated" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_select_own_tenant" ON public.audit_logs;
    DROP POLICY IF EXISTS "audit_logs_insert_own_tenant" ON public.audit_logs;

    CREATE POLICY "audit_logs_select_own_tenant" ON public.audit_logs
      FOR SELECT USING (
        auth.uid() = user_id
        OR public.has_company_access(company_id)
        OR public.is_admin()
      );

    CREATE POLICY "audit_logs_insert_own_tenant" ON public.audit_logs
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (user_id IS NULL OR user_id = auth.uid())
        AND (company_id IS NULL OR public.has_company_access(company_id))
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. Alineación RLS de consultoría en tablas operativas pendientes
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- 4.1 public.memorias_anuales
  IF to_regclass('public.memorias_anuales') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own memorias" ON public.memorias_anuales;
    DROP POLICY IF EXISTS "Users can create own memorias" ON public.memorias_anuales;
    DROP POLICY IF EXISTS "Users can update own memorias" ON public.memorias_anuales;
    DROP POLICY IF EXISTS "Users can delete own memorias" ON public.memorias_anuales;

    CREATE POLICY "Users can view own memorias" ON public.memorias_anuales
      FOR SELECT USING (
        auth.uid() = user_id
        OR public.has_company_access(company_id)
        OR public.is_admin()
      );

    CREATE POLICY "Users can create own memorias" ON public.memorias_anuales
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    CREATE POLICY "Users can update own memorias" ON public.memorias_anuales
      FOR UPDATE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      )
      WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    CREATE POLICY "Users can delete own memorias" ON public.memorias_anuales
      FOR DELETE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
        OR public.is_admin()
      );
  END IF;

  -- 4.2 public.prior_notifications
  IF to_regclass('public.prior_notifications') IS NOT NULL THEN
    DROP POLICY IF EXISTS prior_notifications_user_isolation ON public.prior_notifications;
    DROP POLICY IF EXISTS prior_notifications_select_tenant ON public.prior_notifications;
    DROP POLICY IF EXISTS prior_notifications_insert_tenant ON public.prior_notifications;
    DROP POLICY IF EXISTS prior_notifications_update_tenant ON public.prior_notifications;
    DROP POLICY IF EXISTS prior_notifications_delete_tenant ON public.prior_notifications;

    CREATE POLICY prior_notifications_select_tenant ON public.prior_notifications
      FOR SELECT USING (
        auth.uid() = user_id
        OR public.has_company_access(company_id)
        OR public.is_admin()
      );

    CREATE POLICY prior_notifications_insert_tenant ON public.prior_notifications
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    CREATE POLICY prior_notifications_update_tenant ON public.prior_notifications
      FOR UPDATE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      )
      WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    CREATE POLICY prior_notifications_delete_tenant ON public.prior_notifications
      FOR DELETE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
        OR public.is_admin()
      );
  END IF;

  -- 4.3 public.environmental_authorizations
  IF to_regclass('public.environmental_authorizations') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own authorizations" ON public.environmental_authorizations;
    DROP POLICY IF EXISTS "Users can insert own authorizations" ON public.environmental_authorizations;
    DROP POLICY IF EXISTS "Users can update own authorizations" ON public.environmental_authorizations;
    DROP POLICY IF EXISTS "Users can delete own authorizations" ON public.environmental_authorizations;

    CREATE POLICY "Users can view own authorizations" ON public.environmental_authorizations
      FOR SELECT USING (
        auth.uid() = user_id
        OR public.has_company_access(company_id)
        OR public.is_admin()
      );

    CREATE POLICY "Users can insert own authorizations" ON public.environmental_authorizations
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    CREATE POLICY "Users can update own authorizations" ON public.environmental_authorizations
      FOR UPDATE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      )
      WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    CREATE POLICY "Users can delete own authorizations" ON public.environmental_authorizations
      FOR DELETE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
        OR public.is_admin()
      );
  END IF;

  -- 4.4 public.treatment_managers (sin company_id directo: acceso vía empresas del propietario)
  IF to_regclass('public.treatment_managers') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own treatment managers" ON public.treatment_managers;
    DROP POLICY IF EXISTS "Users can insert own treatment managers" ON public.treatment_managers;
    DROP POLICY IF EXISTS "Users can update own treatment managers" ON public.treatment_managers;
    DROP POLICY IF EXISTS "Users can delete own treatment managers" ON public.treatment_managers;

    CREATE POLICY "Users can view own treatment managers" ON public.treatment_managers
      FOR SELECT USING (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.treatment_managers.user_id
            AND m.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can insert own treatment managers" ON public.treatment_managers
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.treatment_managers.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      );

    CREATE POLICY "Users can update own treatment managers" ON public.treatment_managers
      FOR UPDATE USING (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.treatment_managers.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.treatment_managers.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      );

    CREATE POLICY "Users can delete own treatment managers" ON public.treatment_managers
      FOR DELETE USING (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.treatment_managers.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      );
  END IF;

  -- 4.5 public.carriers (sin company_id directo: acceso vía empresas del propietario)
  IF to_regclass('public.carriers') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own carriers" ON public.carriers;
    DROP POLICY IF EXISTS "Users can insert own carriers" ON public.carriers;
    DROP POLICY IF EXISTS "Users can update own carriers" ON public.carriers;
    DROP POLICY IF EXISTS "Users can delete own carriers" ON public.carriers;

    CREATE POLICY "Users can view own carriers" ON public.carriers
      FOR SELECT USING (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.carriers.user_id
            AND m.user_id = auth.uid()
        )
      );

    CREATE POLICY "Users can insert own carriers" ON public.carriers
      FOR INSERT WITH CHECK (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.carriers.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      );

    CREATE POLICY "Users can update own carriers" ON public.carriers
      FOR UPDATE USING (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.carriers.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      )
      WITH CHECK (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.carriers.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      );

    CREATE POLICY "Users can delete own carriers" ON public.carriers
      FOR DELETE USING (
        auth.uid() = user_id
        OR public.is_admin()
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          JOIN public.company_memberships m ON m.company_id = c.id
          WHERE c.user_id = public.carriers.user_id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 5. public.chronological_registry: bloqueo RLS de borrado < 5 años (Art. 64 Ley 7/2022)
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.chronological_registry') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can update own chronological entries" ON public.chronological_registry;
    CREATE POLICY "Users can update own chronological entries" ON public.chronological_registry
      FOR UPDATE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      )
      WITH CHECK (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );

    DROP POLICY IF EXISTS "Users can delete own chronological entries" ON public.chronological_registry;
    CREATE POLICY "Users can delete own chronological entries" ON public.chronological_registry
      FOR DELETE USING (
        (auth.uid() = user_id OR public.has_company_write_access(company_id) OR public.is_admin())
        AND (fecha < (CURRENT_DATE - INTERVAL '5 years') OR public.is_admin())
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 6. public.get_deca_by_token: aplicar caducidad de 7 días en la propia RPC
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.get_deca_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    IF p_token IS NULL OR length(btrim(p_token)) = 0 THEN
        RETURN NULL;
    END IF;

    SELECT
      CASE
        WHEN d.fecha_finalizacion IS NOT NULL AND d.fecha_finalizacion <= (now() - interval '7 days') THEN
          jsonb_build_object(
            'id', d.id,
            'token', d.token,
            'estado', d.estado,
            'fecha_finalizacion', d.fecha_finalizacion,
            'expired', true
          )
        ELSE to_jsonb(d)
      END
    INTO v_result
    FROM public.deca_documents d
    WHERE d.token = btrim(p_token)
    LIMIT 1;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_deca_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_deca_by_token(TEXT) TO anon, authenticated;

COMMIT;

