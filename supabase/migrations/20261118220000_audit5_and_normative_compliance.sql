-- ==============================================================================
-- RESIGEST 360 - BLOQUE 5ª AUDITORÍA (18/11/2026) Y ORIENTACIONES NORMATIVAS
-- 1. P0 N01: Corrección de get_di_by_signing_token y sign_di_by_signing_token
--    (elimina referencia a columna inexistente tipo_documento y añade audit_logs).
-- 2. P0 A04-02: Versionado de contratos (version, revision_history) e invalidación
--    automática de firmas ante cambios materiales.
-- 3. P1 QA5-I01 y A04-06: Compartición multi-actor de DI (transportista_company_id,
--    gestor_company_id) y políticas RLS por intervención.
-- 4. P1 A04-01: Política RLS INSERT en companies para consultoría delegada.
-- 5. P1 A04-05 y A04-07: Habilitación de 'contratos' en chatarreria y
--    'memorias_anuales' en productor.
-- 6. P1 A04-09 y QA5-I02: fecha_hora_movimiento en chronological_registry y
--    modalidad_posesion en commercial_operations.
-- 7. RD 764/2026 y Ley 7/2022: Inscripciones registrales por centro, estado de
--    verificación de NIMA, transmisión de titularidad y contenedores detallados.
-- ==============================================================================

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. P0 N01: RPCs de firma pública de DI sin columna inexistente tipo_documento
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.get_di_by_signing_token(UUID);
CREATE OR REPLACE FUNCTION public.get_di_by_signing_token(p_token UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(t) INTO v_result
    FROM (
        SELECT
            di.*,
            to_jsonb(c) - 'holded_api_key' - 'sira_usuario' - 'sira_password' - 'user_id' AS company,
            to_jsonb(pc) AS production_center,
            to_jsonb(wt) AS waste_type
        FROM public.identification_documents di
        LEFT JOIN public.companies c ON di.company_id = c.id
        LEFT JOIN public.production_centers pc ON di.production_center_id = pc.id
        LEFT JOIN public.waste_types wt ON di.waste_type_id = wt.id
        WHERE di.signing_token = p_token
          AND (di.signing_token_expires_at IS NULL OR di.signing_token_expires_at > now())
        LIMIT 1
    ) t;

    RETURN v_result;
END;
$$;

DROP FUNCTION IF EXISTS public.sign_di_by_signing_token(UUID, TEXT, TEXT, TEXT, TEXT);
CREATE OR REPLACE FUNCTION public.sign_di_by_signing_token(
    p_token UUID,
    p_role TEXT,
    p_signature_url TEXT,
    p_signer_name TEXT DEFAULT NULL,
    p_signer_dni TEXT DEFAULT NULL
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_id BIGINT;
    v_company_id BIGINT;
    v_user_id UUID;
    v_num_doc TEXT;
    v_firmado_prod BOOLEAN;
    v_firmado_trans BOOLEAN;
    v_firmado_gest BOOLEAN;
    v_estado_traslado TEXT;
BEGIN
    IF p_role NOT IN ('productor', 'transportista', 'gestor') THEN
        RAISE EXCEPTION 'Rol de firma inválido';
    END IF;

    SELECT id, company_id, user_id, numero_documento, estado_traslado
      INTO v_id, v_company_id, v_user_id, v_num_doc, v_estado_traslado
      FROM public.identification_documents
     WHERE signing_token = p_token
       AND (signing_token_expires_at IS NULL OR signing_token_expires_at > now())
     FOR UPDATE;

    IF v_id IS NULL THEN
        RAISE EXCEPTION 'Documento de Identificación no encontrado o token inválido';
    END IF;

    IF p_role = 'productor' THEN
        UPDATE public.identification_documents
           SET firmado_productor = true,
               fecha_firma_productor = now(),
               firma_productor_url = p_signature_url,
               nombre_productor = COALESCE(NULLIF(BTRIM(p_signer_name), ''), nombre_productor),
               dni_productor = COALESCE(NULLIF(BTRIM(p_signer_dni), ''), dni_productor),
               updated_at = now()
         WHERE id = v_id
           AND (firmado_productor IS FALSE OR firma_productor_url IS NULL);
    ELSIF p_role = 'transportista' THEN
        UPDATE public.identification_documents
           SET firmado_transportista = true,
               fecha_firma_transportista = now(),
               firma_transportista_url = p_signature_url,
               nombre_transportista = COALESCE(NULLIF(BTRIM(p_signer_name), ''), nombre_transportista),
               dni_transportista = COALESCE(NULLIF(BTRIM(p_signer_dni), ''), dni_transportista),
               updated_at = now()
         WHERE id = v_id
           AND (firmado_transportista IS FALSE OR firma_transportista_url IS NULL);
    ELSE
        UPDATE public.identification_documents
           SET firmado_gestor = true,
               fecha_firma_gestor = now(),
               firma_gestor_url = p_signature_url,
               nombre_gestor = COALESCE(NULLIF(BTRIM(p_signer_name), ''), nombre_gestor),
               dni_gestor = COALESCE(NULLIF(BTRIM(p_signer_dni), ''), dni_gestor),
               updated_at = now()
         WHERE id = v_id
           AND (firmado_gestor IS FALSE OR firma_gestor_url IS NULL);
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El Documento de Identificación ya fue firmado por este rol';
    END IF;

    SELECT firmado_productor, firmado_transportista, firmado_gestor
      INTO v_firmado_prod, v_firmado_trans, v_firmado_gest
      FROM public.identification_documents
     WHERE id = v_id;

    -- Solo marcar como documentalmente 'completado' si las partes han firmado y el traslado está tratado/aceptado
    IF v_firmado_prod AND v_firmado_trans AND v_firmado_gest AND COALESCE(v_estado_traslado, '') IN ('aceptado', 'tratado') THEN
        UPDATE public.identification_documents
           SET estado = 'completado',
               updated_at = now()
         WHERE id = v_id
           AND estado IN ('borrador', 'pendiente-firma');
    ELSE
        UPDATE public.identification_documents
           SET estado = 'pendiente-firma',
               updated_at = now()
         WHERE id = v_id
           AND estado = 'borrador';
    END IF;

    -- Registrar evento en audit_logs incluso desde sesión anónima
    IF to_regclass('public.audit_logs') IS NOT NULL THEN
        INSERT INTO public.audit_logs (user_id, company_id, entidad, entidad_id, accion, detalles)
        VALUES (
            COALESCE(auth.uid(), v_user_id),
            v_company_id,
            'di',
            v_id::TEXT,
            'actualizar',
            jsonb_build_object(
                'numero_documento', v_num_doc,
                'rol_firma', p_role,
                'via', 'enlace_publico',
                'firmante_nombre', p_signer_name,
                'firmante_dni', p_signer_dni
            )
        );
    END IF;

    RETURN public.get_di_by_signing_token(p_token);
END;
$$;

REVOKE ALL ON FUNCTION public.get_di_by_signing_token(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sign_di_by_signing_token(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_di_by_signing_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_di_by_signing_token(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. P0 A04-02: Versionado de contratos e historial de revisiones firmadas
-- ------------------------------------------------------------------------------
ALTER TABLE public.waste_contracts
  ADD COLUMN IF NOT EXISTS version INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS revision_history JSONB NOT NULL DEFAULT '[]'::jsonb;

-- ------------------------------------------------------------------------------
-- 3. P1 QA5-I01 y A04-06: Cadena compartida de DI entre Productor, Transportista y Gestor
-- ------------------------------------------------------------------------------
ALTER TABLE public.identification_documents
  ADD COLUMN IF NOT EXISTS transportista_company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS gestor_company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS operador_razon_social TEXT,
  ADD COLUMN IF NOT EXISTS operador_cif TEXT,
  ADD COLUMN IF NOT EXISTS operador_nima TEXT,
  ADD COLUMN IF NOT EXISTS operador_direccion TEXT,
  ADD COLUMN IF NOT EXISTS operador_codigo_postal TEXT,
  ADD COLUMN IF NOT EXISTS operador_municipio TEXT,
  ADD COLUMN IF NOT EXISTS operador_provincia TEXT,
  ADD COLUMN IF NOT EXISTS operador_telefono TEXT,
  ADD COLUMN IF NOT EXISTS operador_email TEXT,
  ADD COLUMN IF NOT EXISTS operador_tipo TEXT DEFAULT 'productor',
  ADD COLUMN IF NOT EXISTS densidad_justificada_kg_m3 NUMERIC(10,3),
  ADD COLUMN IF NOT EXISTS contenedor_detalles JSONB,
  ADD COLUMN IF NOT EXISTS fecha_inicio_deposito DATE;

CREATE INDEX IF NOT EXISTS idx_di_transportista_company_id ON public.identification_documents(transportista_company_id);
CREATE INDEX IF NOT EXISTS idx_di_gestor_company_id ON public.identification_documents(gestor_company_id);

-- Backfill de transportista_company_id y gestor_company_id cruzando CIF con empresas titulares propias
UPDATE public.identification_documents di
   SET transportista_company_id = c.id
  FROM public.companies c
 WHERE di.transportista_company_id IS NULL
   AND c.is_my_company = true
   AND di.transportista_cif IS NOT NULL
   AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(di.transportista_cif));

UPDATE public.identification_documents di
   SET gestor_company_id = c.id
  FROM public.companies c
 WHERE di.gestor_company_id IS NULL
   AND c.is_my_company = true
   AND di.gestor_cif IS NOT NULL
   AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(di.gestor_cif));

-- Función helper para verificar si el usuario autenticado interviene en un DI (Productor, Transportista, Gestor o Consultor delegado)
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

    -- Fallback por CIF de empresa titular propia o delegada cuando el ID aún no estaba poblado
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
                        WHERE m.company_id = c.id AND m.user_id = auth.uid()
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

DROP POLICY IF EXISTS "Users can view own identification documents" ON public.identification_documents;
CREATE POLICY "Users can view own identification documents" ON public.identification_documents
  FOR SELECT USING (
    public.has_di_access(
      user_id,
      company_id,
      transportista_company_id,
      gestor_company_id,
      transportista_cif,
      gestor_cif
    )
  );

DROP POLICY IF EXISTS "Users can update own identification documents" ON public.identification_documents;
CREATE POLICY "Users can update own identification documents" ON public.identification_documents
  FOR UPDATE USING (
    public.has_di_access(
      user_id,
      company_id,
      transportista_company_id,
      gestor_company_id,
      transportista_cif,
      gestor_cif
    )
  );

-- Permitir también que el Gestor destinatario consulte los contratos donde es gestor_company_id
DROP POLICY IF EXISTS "Users can view own contracts" ON public.waste_contracts;
CREATE POLICY "Users can view own contracts" ON public.waste_contracts
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(company_id)
    OR (gestor_company_id IS NOT NULL AND public.has_company_access(gestor_company_id))
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can update own contracts" ON public.waste_contracts;
CREATE POLICY "Users can update own contracts" ON public.waste_contracts
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
    OR (gestor_company_id IS NOT NULL AND public.has_company_write_access(gestor_company_id))
  );

-- ------------------------------------------------------------------------------
-- 4. P1 A04-01: Lectura y escritura delegada de contactos en public.companies
-- ------------------------------------------------------------------------------
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

    -- Si es un contacto del directorio de un cliente delegado (mismo user_id que la empresa titular delegada)
    RETURN EXISTS (
        SELECT 1
          FROM public.companies titular
          JOIN public.company_memberships m ON m.company_id = titular.id
         WHERE titular.user_id = p_owner_user_id
           AND titular.is_my_company = true
           AND m.user_id = auth.uid()
    );
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
    IF auth.uid() = p_owner_user_id OR public.is_admin() THEN
        RETURN TRUE;
    END IF;

    -- Un consultor con permiso de escritura sobre la empresa titular de p_owner_user_id puede dar de alta contactos (is_my_company = false)
    IF COALESCE(p_is_my_company, false) = false THEN
        RETURN EXISTS (
            SELECT 1
              FROM public.companies titular
              JOIN public.company_memberships m ON m.company_id = titular.id
             WHERE titular.user_id = p_owner_user_id
               AND titular.is_my_company = true
               AND m.user_id = auth.uid()
               AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        );
    END IF;

    RETURN FALSE;
END;
$$;

DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
CREATE POLICY "Users can view own companies" ON public.companies
  FOR SELECT USING (
    public.can_access_contact_company(user_id, id)
  );

DROP POLICY IF EXISTS "Users can insert own companies" ON public.companies;
CREATE POLICY "Users can insert own companies" ON public.companies
  FOR INSERT WITH CHECK (
    public.can_write_contact_company(user_id, is_my_company)
  );

DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
CREATE POLICY "Users can update own companies" ON public.companies
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_company_write_access(id)
    OR public.can_write_contact_company(user_id, is_my_company)
  );

-- ------------------------------------------------------------------------------
-- 5. P1 A04-05 y A04-07: Habilitar 'contratos' en chatarreria y 'memorias_anuales' en productor
-- ------------------------------------------------------------------------------
UPDATE public.companies
   SET modulos_activos = array_append(modulos_activos, 'contratos')
 WHERE perfil_operativo = 'chatarreria'
   AND NOT ('contratos' = ANY(COALESCE(modulos_activos, '{}')));

UPDATE public.companies
   SET modulos_activos = array_append(modulos_activos, 'memorias_anuales')
 WHERE perfil_operativo = 'productor'
   AND NOT ('memorias_anuales' = ANY(COALESCE(modulos_activos, '{}')));

-- ------------------------------------------------------------------------------
-- 6. P1 A04-09 y QA5-I02: Timestamps en Archivo Cronológico y Posesión en Operaciones
-- ------------------------------------------------------------------------------
ALTER TABLE public.chronological_registry
  ADD COLUMN IF NOT EXISTS fecha_hora_movimiento TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS contenedor_detalles JSONB,
  ADD COLUMN IF NOT EXISTS fecha_inicio_deposito DATE;

ALTER TABLE public.commercial_operations
  ADD COLUMN IF NOT EXISTS modalidad_posesion TEXT DEFAULT 'intermediacion_sin_posesion'
    CHECK (modalidad_posesion IN ('intermediacion_sin_posesion', 'almacenamiento_planta_propia'));

-- ------------------------------------------------------------------------------
-- 7. RD 764/2026: Estado de verificación NIMA, Inscripciones por Centro y Transmisión
-- ------------------------------------------------------------------------------
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS cnae TEXT,
  ADD COLUMN IF NOT EXISTS estado_verificacion_nima TEXT DEFAULT 'pendiente_verificar',
  ADD COLUMN IF NOT EXISTS fecha_ultima_verificacion_nima TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipo_inscripcion TEXT;

ALTER TABLE public.production_centers
  ADD COLUMN IF NOT EXISTS cnae TEXT,
  ADD COLUMN IF NOT EXISTS estado_verificacion_nima TEXT DEFAULT 'pendiente_verificar',
  ADD COLUMN IF NOT EXISTS fecha_ultima_verificacion_nima TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS tipo_inscripcion TEXT,
  ADD COLUMN IF NOT EXISTS numero_inscripcion TEXT,
  ADD COLUMN IF NOT EXISTS organismo_registro TEXT,
  ADD COLUMN IF NOT EXISTS inscripciones_registro JSONB DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS historial_titularidad JSONB DEFAULT '[]'::jsonb;

ALTER TABLE public.prior_notifications
  ADD COLUMN IF NOT EXISTS destino_posterior_razon_social TEXT,
  ADD COLUMN IF NOT EXISTS destino_posterior_cif TEXT,
  ADD COLUMN IF NOT EXISTS destino_posterior_nima TEXT,
  ADD COLUMN IF NOT EXISTS destino_posterior_operacion_rd TEXT;

COMMIT;

