-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN: DELEGACIÓN EXPLÍCITA CON CONSENTIMIENTO Y CADUCIDAD
-- 1. Columnas de caducidad, consentimiento RGPD Art. 28 y trazabilidad en company_memberships
-- 2. Actualización de helpers RLS para cortar acceso automáticamente al caducar expires_at
-- 3. Alineación RLS de auditoría y borrado delegado
-- 4. RPCs SECURITY DEFINER (grant_company_delegation, get_company_delegations) para
--    fase piloto con delegado oficial único sin exponer public.profiles
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. Columnas de caducidad, consentimiento y motivo en company_memberships
--    y columnas de bloqueo de acceso en companies
-- ------------------------------------------------------------------------------
ALTER TABLE public.company_memberships
  ADD COLUMN IF NOT EXISTS expires_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS granted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS delegation_reason TEXT,
  ADD COLUMN IF NOT EXISTS terms_accepted_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS terms_version TEXT;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS blocked_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS blocked_reason TEXT,
  ADD COLUMN IF NOT EXISTS blocked_by UUID REFERENCES auth.users(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_company_memberships_user_company_expires
  ON public.company_memberships(user_id, company_id, expires_at);

-- ------------------------------------------------------------------------------
-- 2. Helpers RLS con validación automática de vigencia (expires_at IS NULL OR expires_at > NOW())
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_company_access(p_company_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_company_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND COALESCE(c.activo, true) = true
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_memberships m
          WHERE m.company_id = c.id
            AND m.user_id = auth.uid()
            AND (m.expires_at IS NULL OR m.expires_at > NOW())
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_company_write_access(p_company_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_company_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND COALESCE(c.activo, true) = true
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_memberships m
          WHERE m.company_id = c.id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
            AND (m.expires_at IS NULL OR m.expires_at > NOW())
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_company_admin_access(p_company_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_company_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND COALESCE(c.activo, true) = true
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_memberships m
          WHERE m.company_id = c.id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin')
            AND (m.expires_at IS NULL OR m.expires_at > NOW())
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.can_access_commercial_op(p_user_id UUID, p_company_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_company_id IS NULL THEN
    RETURN auth.uid() = p_user_id AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.user_id = auth.uid()
        AND c.is_my_company = true
        AND 'operaciones_comerciales' = ANY(COALESCE(c.modulos_activos, '{}'))
    );
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND 'operaciones_comerciales' = ANY(COALESCE(c.modulos_activos, '{}'))
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_memberships m
          WHERE m.company_id = c.id
            AND m.user_id = auth.uid()
            AND m.can_view_commercial = true
            AND (m.expires_at IS NULL OR m.expires_at > NOW())
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE SET search_path = public;

CREATE OR REPLACE FUNCTION public.has_di_access(
    p_user_id UUID,
    p_company_id BIGINT,
    p_transportista_company_id BIGINT,
    p_gestor_company_id BIGINT,
    p_transportista_cif TEXT,
    p_gestor_cif TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    IF auth.uid() = p_user_id OR public.is_admin() THEN
        RETURN TRUE;
    END IF;

    IF p_company_id IS NOT NULL AND public.has_company_access(p_company_id) THEN
        RETURN TRUE;
    END IF;

    IF p_transportista_company_id IS NOT NULL AND public.has_company_access(p_transportista_company_id) THEN
        RETURN TRUE;
    END IF;

    IF p_gestor_company_id IS NOT NULL AND public.has_company_access(p_gestor_company_id) THEN
        RETURN TRUE;
    END IF;

    IF (p_transportista_cif IS NOT NULL AND BTRIM(p_transportista_cif) <> '') OR
       (p_gestor_cif IS NOT NULL AND BTRIM(p_gestor_cif) <> '') THEN
        RETURN EXISTS (
            SELECT 1
              FROM public.companies c
             WHERE c.is_my_company = true
               AND (
                   c.user_id = auth.uid()
                   OR EXISTS (
                       SELECT 1 FROM public.company_memberships m
                        WHERE m.company_id = c.id
                          AND m.user_id = auth.uid()
                          AND (m.expires_at IS NULL OR m.expires_at > NOW())
                   )
               )
               AND (
                   (p_transportista_cif IS NOT NULL AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(p_transportista_cif)))
                   OR (p_gestor_cif IS NOT NULL AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(p_gestor_cif)))
               )
        );
    END IF;

    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_access_contact_company(p_owner_user_id UUID, p_company_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    IF auth.uid() = p_owner_user_id OR public.is_admin() THEN
        RETURN TRUE;
    END IF;

    IF p_company_id IS NOT NULL AND public.has_company_access(p_company_id) THEN
        RETURN TRUE;
    END IF;

    RETURN EXISTS (
        SELECT 1
          FROM public.companies titular
          JOIN public.company_memberships m ON m.company_id = titular.id
         WHERE titular.user_id = p_owner_user_id
           AND titular.is_my_company = true
           AND m.user_id = auth.uid()
           AND (m.expires_at IS NULL OR m.expires_at > NOW())
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.has_di_write_access(
    p_user_id UUID,
    p_company_id BIGINT,
    p_transportista_company_id BIGINT,
    p_gestor_company_id BIGINT,
    p_transportista_cif TEXT,
    p_gestor_cif TEXT
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    IF auth.uid() = p_user_id THEN
        RETURN TRUE;
    END IF;

    IF p_company_id IS NOT NULL AND public.has_company_write_access(p_company_id) THEN
        RETURN TRUE;
    END IF;

    IF p_transportista_company_id IS NOT NULL AND public.has_company_write_access(p_transportista_company_id) THEN
        RETURN TRUE;
    END IF;

    IF p_gestor_company_id IS NOT NULL AND public.has_company_write_access(p_gestor_company_id) THEN
        RETURN TRUE;
    END IF;

    IF (p_transportista_cif IS NOT NULL AND BTRIM(p_transportista_cif) <> '') OR
       (p_gestor_cif IS NOT NULL AND BTRIM(p_gestor_cif) <> '') THEN
        RETURN EXISTS (
            SELECT 1
              FROM public.companies c
             WHERE c.is_my_company = true
               AND (
                   c.user_id = auth.uid()
                   OR EXISTS (
                       SELECT 1 FROM public.company_memberships m
                        WHERE m.company_id = c.id
                          AND m.user_id = auth.uid()
                          AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
                          AND (m.expires_at IS NULL OR m.expires_at > NOW())
                   )
               )
               AND (
                   (p_transportista_cif IS NOT NULL AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(p_transportista_cif)))
                   OR (p_gestor_cif IS NOT NULL AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(p_gestor_cif)))
               )
        );
    END IF;

    RETURN FALSE;
END;
$$;

CREATE OR REPLACE FUNCTION public.can_write_contact_company(p_owner_user_id UUID, p_is_my_company BOOLEAN)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
BEGIN
    IF auth.uid() = p_owner_user_id THEN
        RETURN TRUE;
    END IF;

    -- Sin bypass directo de is_admin(): exige delegación de escritura vigente
    IF COALESCE(p_is_my_company, false) = false THEN
        RETURN EXISTS (
            SELECT 1
              FROM public.companies titular
              JOIN public.company_memberships m ON m.company_id = titular.id
             WHERE titular.user_id = p_owner_user_id
               AND titular.is_my_company = true
               AND m.user_id = auth.uid()
               AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
               AND (m.expires_at IS NULL OR m.expires_at > NOW())
        );
    END IF;

    RETURN FALSE;
END;
$$;

-- Trigger de integridad: impide que un usuario delegado cambie titularidad o credenciales secretas
CREATE OR REPLACE FUNCTION public.prevent_delegated_company_tampering()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF auth.uid() IS NOT NULL AND auth.uid() <> OLD.user_id THEN
        IF NEW.user_id IS DISTINCT FROM OLD.user_id THEN
            RAISE EXCEPTION 'Acceso denegado: un usuario delegado no puede transferir la propiedad de la empresa';
        END IF;

        IF NEW.is_my_company IS DISTINCT FROM OLD.is_my_company THEN
            RAISE EXCEPTION 'Acceso denegado: un usuario delegado no puede cambiar el tipo de titularidad de la empresa';
        END IF;

        IF NEW.sira_password IS DISTINCT FROM OLD.sira_password THEN
            RAISE EXCEPTION 'Acceso denegado: solo el titular de la empresa puede modificar credenciales SIRA';
        END IF;

        IF NEW.holded_api_key IS DISTINCT FROM OLD.holded_api_key THEN
            RAISE EXCEPTION 'Acceso denegado: solo el titular de la empresa puede modificar la API key de Holded';
        END IF;
    END IF;

    RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prevent_delegated_company_tampering ON public.companies;
CREATE TRIGGER trg_prevent_delegated_company_tampering
  BEFORE UPDATE ON public.companies
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_delegated_company_tampering();

-- ------------------------------------------------------------------------------
-- 3. Endurecimiento RLS: companies, identification_documents, company_memberships, audit_logs
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  -- 3.1 companies: solo propietario o consultor_admin vigente puede modificar empresa titular
  DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
  CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE USING (
      auth.uid() = user_id
      OR (COALESCE(is_my_company, false) = true AND public.has_company_admin_access(id))
      OR (COALESCE(is_my_company, false) = false AND public.can_write_contact_company(user_id, false))
    )
    WITH CHECK (
      auth.uid() = user_id
      OR (COALESCE(is_my_company, false) = true AND public.has_company_admin_access(id))
      OR (COALESCE(is_my_company, false) = false AND public.can_write_contact_company(user_id, false))
    );

  -- 3.2 identification_documents: UPDATE exige permiso de escritura vigente (bloquea 'lectura' y admin sin delegación)
  DROP POLICY IF EXISTS "Users can update own identification documents" ON public.identification_documents;
  CREATE POLICY "Users can update own identification documents" ON public.identification_documents
    FOR UPDATE USING (
      public.has_di_write_access(
        user_id,
        company_id,
        transportista_company_id,
        gestor_company_id,
        transportista_cif,
        gestor_cif
      )
    );

  -- 3.3 company_memberships: bloquear INSERT/UPDATE/DELETE directos (obligar paso por RPCs auditadas)
  DROP POLICY IF EXISTS "Company owners can manage memberships" ON public.company_memberships;
  DROP POLICY IF EXISTS "Users can view own memberships" ON public.company_memberships;
  CREATE POLICY "Users can view own memberships" ON public.company_memberships
    FOR SELECT USING (
      auth.uid() = user_id
      OR public.is_admin()
      OR EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = company_memberships.company_id
          AND c.user_id = auth.uid()
      )
    );

  IF to_regclass('public.audit_logs') IS NOT NULL THEN
    DROP POLICY IF EXISTS "audit_logs_insert_own_tenant" ON public.audit_logs;
    CREATE POLICY "audit_logs_insert_own_tenant" ON public.audit_logs
      FOR INSERT WITH CHECK (
        auth.uid() IS NOT NULL
        AND (user_id IS NULL OR user_id = auth.uid())
        AND (company_id IS NULL OR public.has_company_access(company_id) OR public.is_admin())
      );
  END IF;

  IF to_regclass('public.production_centers') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can delete own production centers" ON public.production_centers;
    CREATE POLICY "Users can delete own production centers" ON public.production_centers
      FOR DELETE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );
  END IF;

  IF to_regclass('public.waste_contracts') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can delete own contracts" ON public.waste_contracts;
    CREATE POLICY "Users can delete own contracts" ON public.waste_contracts
      FOR DELETE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );
  END IF;

  IF to_regclass('public.identification_documents') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can delete own identification documents" ON public.identification_documents;
    CREATE POLICY "Users can delete own identification documents" ON public.identification_documents
      FOR DELETE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 4. RPCs SECURITY DEFINER para gestión de delegaciones en fase piloto
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.grant_company_delegation(
    p_company_id BIGINT,
    p_role TEXT DEFAULT 'consultor_admin',
    p_can_view_commercial BOOLEAN DEFAULT false,
    p_expires_at TIMESTAMPTZ DEFAULT NULL,
    p_reason TEXT DEFAULT NULL,
    p_terms_accepted BOOLEAN DEFAULT false,
    p_terms_version TEXT DEFAULT '2026-11-v1',
    p_delegate_email TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_is_admin BOOLEAN := public.is_admin();
    v_is_owner BOOLEAN := false;
    v_delegate_id UUID;
    v_delegate_email TEXT;
    v_delegate_name TEXT;
    v_row public.company_memberships%ROWTYPE;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF p_role NOT IN ('consultor_admin', 'consultor_operador', 'lectura') THEN
        RAISE EXCEPTION 'Rol de delegación inválido';
    END IF;

    IF p_expires_at IS NOT NULL AND p_expires_at <= NOW() THEN
        RAISE EXCEPTION 'La fecha de caducidad debe ser posterior a la fecha actual';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = p_company_id
          AND c.user_id = v_caller
          AND c.is_my_company = true
          AND COALESCE(c.activo, true) = true
    ) INTO v_is_owner;

    IF NOT v_is_owner AND NOT v_is_admin THEN
        RAISE EXCEPTION 'Acceso denegado: solo el titular de la empresa o un administrador puede gestionar delegaciones';
    END IF;

    -- Validar que la empresa destino existe y es titular activa
    IF NOT EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = p_company_id
          AND c.is_my_company = true
          AND COALESCE(c.activo, true) = true
    ) THEN
        RAISE EXCEPTION 'La empresa indicada no existe o no es una empresa titular activa';
    END IF;

    -- Reglas de consentimiento y trazabilidad
    IF v_is_owner AND NOT v_is_admin AND COALESCE(p_terms_accepted, false) = false THEN
        RAISE EXCEPTION 'Debes aceptar las condiciones legales de delegación antes de continuar';
    END IF;

    IF v_is_admin AND NOT v_is_owner AND COALESCE(BTRIM(p_reason), '') = '' THEN
        RAISE EXCEPTION 'El administrador debe indicar un motivo o referencia de autorización para activar la delegación';
    END IF;

    -- Fase piloto: resolver el único delegado oficial (cuenta con rol admin/superadmin)
    IF p_delegate_email IS NOT NULL AND BTRIM(p_delegate_email) <> '' THEN
        SELECT p.id, p.email, COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), p.email)
          INTO v_delegate_id, v_delegate_email, v_delegate_name
          FROM public.profiles p
         WHERE LOWER(BTRIM(p.email)) = LOWER(BTRIM(p_delegate_email))
           AND (p.role::TEXT IN ('admin', 'superadmin') OR LOWER(BTRIM(p.email)) = 'alfredobape@gmail.com')
         LIMIT 1;
    ELSIF v_is_admin AND NOT v_is_owner THEN
        SELECT p.id, p.email, COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), p.email)
          INTO v_delegate_id, v_delegate_email, v_delegate_name
          FROM public.profiles p
         WHERE p.id = v_caller
         LIMIT 1;
    ELSE
        SELECT p.id, p.email, COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), p.email)
          INTO v_delegate_id, v_delegate_email, v_delegate_name
          FROM public.profiles p
         WHERE p.role::TEXT IN ('admin', 'superadmin')
            OR LOWER(BTRIM(p.email)) IN ('admin@resigest.com', 'alfredobape@gmail.com')
         ORDER BY
            CASE WHEN LOWER(BTRIM(p.email)) = 'admin@resigest.com' THEN 0 ELSE 1 END,
            p.created_at ASC
         LIMIT 1;
    END IF;

    IF v_delegate_id IS NULL THEN
        RAISE EXCEPTION 'No se encontró la cuenta de administrador oficial para la delegación piloto';
    END IF;

    INSERT INTO public.company_memberships (
        company_id,
        user_id,
        role,
        can_view_commercial,
        expires_at,
        granted_by,
        delegation_reason,
        terms_accepted_at,
        terms_version,
        updated_at
    ) VALUES (
        p_company_id,
        v_delegate_id,
        p_role,
        COALESCE(p_can_view_commercial, false),
        p_expires_at,
        v_caller,
        NULLIF(BTRIM(p_reason), ''),
        CASE WHEN COALESCE(p_terms_accepted, false) THEN NOW() ELSE NULL END,
        CASE WHEN COALESCE(p_terms_accepted, false) THEN COALESCE(NULLIF(BTRIM(p_terms_version), ''), '2026-11-v1') ELSE NULL END,
        NOW()
    )
    ON CONFLICT (company_id, user_id) DO UPDATE SET
        role = EXCLUDED.role,
        can_view_commercial = EXCLUDED.can_view_commercial,
        expires_at = EXCLUDED.expires_at,
        granted_by = EXCLUDED.granted_by,
        delegation_reason = COALESCE(EXCLUDED.delegation_reason, public.company_memberships.delegation_reason),
        terms_accepted_at = COALESCE(EXCLUDED.terms_accepted_at, public.company_memberships.terms_accepted_at),
        terms_version = COALESCE(EXCLUDED.terms_version, public.company_memberships.terms_version),
        updated_at = NOW()
    RETURNING * INTO v_row;

    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        INSERT INTO public.audit_logs (user_id, company_id, entidad, entidad_id, accion, detalles)
        VALUES (
            v_caller,
            p_company_id,
            'empresa',
            p_company_id::TEXT,
            'actualizar',
            jsonb_build_object(
                'tipo', CASE WHEN v_is_owner AND NOT v_is_admin THEN 'delegacion_titular_autorizada' ELSE 'delegacion_admin_activada' END,
                'delegate_user_id', v_delegate_id,
                'delegate_email', v_delegate_email,
                'role', v_row.role,
                'can_view_commercial', v_row.can_view_commercial,
                'expires_at', v_row.expires_at,
                'reason', v_row.delegation_reason,
                'terms_accepted_at', v_row.terms_accepted_at,
                'terms_version', v_row.terms_version
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'id', v_row.id,
        'company_id', v_row.company_id,
        'user_id', v_row.user_id,
        'delegate_email', v_delegate_email,
        'delegate_name', v_delegate_name,
        'role', v_row.role,
        'can_view_commercial', v_row.can_view_commercial,
        'expires_at', v_row.expires_at,
        'granted_by', v_row.granted_by,
        'delegation_reason', v_row.delegation_reason,
        'terms_accepted_at', v_row.terms_accepted_at,
        'terms_version', v_row.terms_version,
        'created_at', v_row.created_at,
        'updated_at', v_row.updated_at
    );
END;
$$;

CREATE OR REPLACE FUNCTION public.get_company_delegations(p_company_id BIGINT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_result JSONB;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF NOT public.is_admin() AND NOT EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = p_company_id
          AND c.user_id = v_caller
    ) THEN
        RAISE EXCEPTION 'Acceso denegado: no puedes consultar delegaciones de esta empresa';
    END IF;

    SELECT COALESCE(
        jsonb_agg(
            jsonb_build_object(
                'id', m.id,
                'company_id', m.company_id,
                'user_id', m.user_id,
                'delegate_email', COALESCE(p.email, 'administracion@resigest.com'),
                'delegate_name', COALESCE(NULLIF(BTRIM(CONCAT_WS(' ', p.first_name, p.last_name)), ''), p.email, 'Administrador ResiGest'),
                'role', m.role,
                'can_view_commercial', m.can_view_commercial,
                'expires_at', m.expires_at,
                'granted_by', m.granted_by,
                'delegation_reason', m.delegation_reason,
                'terms_accepted_at', m.terms_accepted_at,
                'terms_version', m.terms_version,
                'created_at', m.created_at,
                'updated_at', m.updated_at
            )
            ORDER BY m.updated_at DESC
        ),
        '[]'::jsonb
    )
    INTO v_result
    FROM public.company_memberships m
    LEFT JOIN public.profiles p ON p.id = m.user_id
    WHERE m.company_id = p_company_id;

    RETURN v_result;
END;
$$;

CREATE OR REPLACE FUNCTION public.revoke_company_delegation(
    p_company_id BIGINT,
    p_delegate_user_id UUID DEFAULT NULL
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_is_admin BOOLEAN := public.is_admin();
    v_is_owner BOOLEAN := false;
    v_target_user_id UUID;
    v_deleted_count INTEGER := 0;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    SELECT EXISTS (
        SELECT 1 FROM public.companies c
        WHERE c.id = p_company_id
          AND c.user_id = v_caller
    ) INTO v_is_owner;

    v_target_user_id := COALESCE(p_delegate_user_id, v_caller);

    IF NOT v_is_owner AND NOT v_is_admin AND v_target_user_id <> v_caller THEN
        RAISE EXCEPTION 'Acceso denegado: no tienes permisos para revocar esta delegación';
    END IF;

    DELETE FROM public.company_memberships
     WHERE company_id = p_company_id
       AND user_id = v_target_user_id;

    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;

    IF v_deleted_count > 0 AND to_regclass('public.audit_logs') IS NOT NULL THEN
        INSERT INTO public.audit_logs (user_id, company_id, entidad, entidad_id, accion, detalles)
        VALUES (
            v_caller,
            p_company_id,
            'empresa',
            p_company_id::TEXT,
            'actualizar',
            jsonb_build_object(
                'tipo', CASE WHEN v_target_user_id = v_caller THEN 'delegacion_admin_revocada' ELSE 'delegacion_titular_revocada' END,
                'delegate_user_id', v_target_user_id
            )
        );
    END IF;

    RETURN v_deleted_count > 0;
END;
$$;

CREATE OR REPLACE FUNCTION public.set_company_access_status(
    p_company_id BIGINT,
    p_active BOOLEAN,
    p_reason TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_caller UUID := auth.uid();
    v_row public.companies%ROWTYPE;
BEGIN
    IF v_caller IS NULL THEN
        RAISE EXCEPTION 'Usuario no autenticado';
    END IF;

    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: solo un administrador de plataforma puede bloquear o activar empresas';
    END IF;

    IF COALESCE(p_active, false) = false AND COALESCE(BTRIM(p_reason), '') = '' THEN
        RAISE EXCEPTION 'Debes indicar un motivo para bloquear el acceso de la empresa';
    END IF;

    UPDATE public.companies
       SET activo = p_active,
           blocked_at = CASE WHEN p_active THEN NULL ELSE NOW() END,
           blocked_reason = CASE WHEN p_active THEN NULL ELSE BTRIM(p_reason) END,
           blocked_by = CASE WHEN p_active THEN NULL ELSE v_caller END,
           updated_at = NOW()
     WHERE id = p_company_id
     RETURNING * INTO v_row;

    IF v_row.id IS NULL THEN
        RAISE EXCEPTION 'Empresa no encontrada';
    END IF;

    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        INSERT INTO public.audit_logs (user_id, company_id, entidad, entidad_id, accion, detalles)
        VALUES (
            v_caller,
            p_company_id,
            'empresa',
            p_company_id::TEXT,
            'actualizar',
            jsonb_build_object(
                'tipo', CASE WHEN p_active THEN 'empresa_acceso_activado' ELSE 'empresa_acceso_bloqueado' END,
                'activo', p_active,
                'reason', NULLIF(BTRIM(p_reason), '')
            )
        );
    END IF;

    RETURN jsonb_build_object(
        'id', v_row.id,
        'activo', v_row.activo,
        'blocked_at', v_row.blocked_at,
        'blocked_reason', v_row.blocked_reason,
        'blocked_by', v_row.blocked_by
    );
END;
$$;

REVOKE ALL ON FUNCTION public.grant_company_delegation(BIGINT, TEXT, BOOLEAN, TIMESTAMPTZ, TEXT, BOOLEAN, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.grant_company_delegation(BIGINT, TEXT, BOOLEAN, TIMESTAMPTZ, TEXT, BOOLEAN, TEXT, TEXT) TO authenticated;

REVOKE ALL ON FUNCTION public.get_company_delegations(BIGINT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_company_delegations(BIGINT) TO authenticated;

REVOKE ALL ON FUNCTION public.revoke_company_delegation(BIGINT, UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.revoke_company_delegation(BIGINT, UUID) TO authenticated;

REVOKE ALL ON FUNCTION public.set_company_access_status(BIGINT, BOOLEAN, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.set_company_access_status(BIGINT, BOOLEAN, TEXT) TO authenticated;

COMMIT;
