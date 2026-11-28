-- ==============================================================================
-- RESIGEST 360 - SÉPTIMA AUDITORÍA (24/11/2026)
-- 1. A7-01: Eliminación de sobrecargas ambiguas (PGRST203) en sign_contract_by_signing_token
--    y get_contract_by_signing_token.
-- 2. A7-05: Políticas RLS de deca_documents compartidas entre intervinientes del DI
--    (Productor, Transportista y Gestor) y unicidad de servicio vigente por DI.
-- 3. A7-09: Permitir production_center_id NULL en memorias_anuales para Negociantes,
--    Agentes y Transportistas sin instalación física propia.
-- ==============================================================================

-- ------------------------------------------------------------------------------
-- 1. A7-01: Limpieza de sobrecargas ambiguas de RPC de firma pública de contratos
-- ------------------------------------------------------------------------------
DROP FUNCTION IF EXISTS public.sign_contract_by_signing_token(UUID, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.sign_contract_by_signing_token(TEXT, TEXT, TEXT);
DROP FUNCTION IF EXISTS public.sign_contract_by_signing_token(TEXT, TEXT, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.sign_contract_by_signing_token(UUID, TEXT, TEXT, TIMESTAMPTZ);
DROP FUNCTION IF EXISTS public.sign_contract_by_signing_token(TEXT, TEXT, TEXT, TEXT, TEXT, TEXT);

DROP FUNCTION IF EXISTS public.get_contract_by_signing_token(UUID);
DROP FUNCTION IF EXISTS public.get_contract_by_signing_token(TEXT);

CREATE OR REPLACE FUNCTION public.get_contract_by_signing_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result JSONB;
BEGIN
  IF p_token IS NULL OR length(btrim(p_token)) < 16 THEN
    RETURN NULL;
  END IF;

  SELECT to_jsonb(t) INTO v_result
  FROM (
    SELECT
      wc.*,
      to_jsonb(p) - 'holded_api_key' - 'sira_usuario' - 'sira_password' - 'user_id' AS company,
      to_jsonb(g) - 'holded_api_key' - 'sira_usuario' - 'sira_password' - 'user_id' AS gestor_company,
      to_jsonb(tm) AS treatment_manager,
      COALESCE(
        (
          SELECT jsonb_agg(to_jsonb(cwc) ORDER BY cwc.id ASC)
          FROM public.contract_waste_codes cwc
          WHERE cwc.contract_id = wc.id
        ),
        '[]'::jsonb
      ) AS contract_waste_codes
    FROM public.waste_contracts wc
    LEFT JOIN public.companies p ON wc.company_id = p.id
    LEFT JOIN public.companies g ON wc.gestor_company_id = g.id
    LEFT JOIN public.treatment_managers tm ON wc.treatment_manager_id = tm.id
    WHERE wc.signing_token::text = btrim(p_token)
      AND (wc.signing_token_expires_at IS NULL OR wc.signing_token_expires_at > NOW())
    LIMIT 1
  ) t;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_contract_by_signing_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_contract_by_signing_token(TEXT) TO anon, authenticated;

CREATE OR REPLACE FUNCTION public.sign_contract_by_signing_token(
  p_token TEXT,
  p_role TEXT,
  p_signature_url TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_contract public.waste_contracts%ROWTYPE;
  v_updated public.waste_contracts%ROWTYPE;
  v_next_prod BOOLEAN;
  v_next_gest BOOLEAN;
  v_next_estado TEXT;
  v_now TIMESTAMPTZ := NOW();
BEGIN
  IF p_token IS NULL OR length(btrim(p_token)) < 16 THEN
    RAISE EXCEPTION 'Token de firma inválido';
  END IF;

  IF p_role NOT IN ('productor', 'gestor') THEN
    RAISE EXCEPTION 'Rol de firma inválido';
  END IF;

  SELECT *
  INTO v_contract
  FROM public.waste_contracts
  WHERE signing_token::text = btrim(p_token)
    AND (signing_token_expires_at IS NULL OR signing_token_expires_at > v_now)
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado o enlace de firma caducado';
  END IF;

  IF v_contract.estado IN ('cancelado', 'finalizado') THEN
    RAISE EXCEPTION 'No se puede firmar un contrato en estado %', v_contract.estado;
  END IF;

  IF p_role = 'productor' AND (COALESCE(v_contract.firmado_productor, FALSE) = TRUE OR v_contract.firma_productor_url IS NOT NULL) THEN
    RAISE EXCEPTION 'La parte productora ya ha firmado este contrato';
  END IF;

  IF p_role = 'gestor' AND (COALESCE(v_contract.firmado_gestor, FALSE) = TRUE OR v_contract.firma_gestor_url IS NOT NULL) THEN
    RAISE EXCEPTION 'La parte gestora ya ha firmado este contrato';
  END IF;

  v_next_prod := CASE WHEN p_role = 'productor' THEN TRUE ELSE (COALESCE(v_contract.firmado_productor, FALSE) OR v_contract.firma_productor_url IS NOT NULL) END;
  v_next_gest := CASE WHEN p_role = 'gestor' THEN TRUE ELSE (COALESCE(v_contract.firmado_gestor, FALSE) OR v_contract.firma_gestor_url IS NOT NULL) END;

  v_next_estado := v_contract.estado;
  IF v_next_prod AND v_next_gest AND v_contract.estado IN ('borrador', 'pendiente_firma') THEN
    v_next_estado := 'vigente';
  ELSIF (v_next_prod OR v_next_gest) AND v_contract.estado = 'borrador' THEN
    v_next_estado := 'pendiente_firma';
  END IF;

  IF p_role = 'productor' THEN
    UPDATE public.waste_contracts
    SET
      firma_productor_url = p_signature_url,
      fecha_firma_productor = v_now,
      firmado_productor = TRUE,
      estado = v_next_estado,
      updated_at = v_now
    WHERE id = v_contract.id
      AND COALESCE(firmado_productor, FALSE) = FALSE
    RETURNING * INTO v_updated;
  ELSE
    UPDATE public.waste_contracts
    SET
      firma_gestor_url = p_signature_url,
      fecha_firma_gestor = v_now,
      firmado_gestor = TRUE,
      estado = v_next_estado,
      updated_at = v_now
    WHERE id = v_contract.id
      AND COALESCE(firmado_gestor, FALSE) = FALSE
    RETURNING * INTO v_updated;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Esta firma ya había sido registrada previamente';
  END IF;

  RETURN COALESCE(public.get_contract_by_signing_token(btrim(p_token)), to_jsonb(v_updated));
END;
$$;

REVOKE ALL ON FUNCTION public.sign_contract_by_signing_token(TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.sign_contract_by_signing_token(TEXT, TEXT, TEXT) TO anon, authenticated;

-- ------------------------------------------------------------------------------
-- 2. A7-05: Compartición de DeCA entre Productor, Transportista y Gestor del mismo DI
-- ------------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.has_di_participant_access(p_di_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_allowed BOOLEAN := FALSE;
BEGIN
  IF p_di_id IS NULL OR v_uid IS NULL THEN
    RETURN FALSE;
  END IF;

  SELECT EXISTS (
    SELECT 1
    FROM public.identification_documents d
    WHERE d.id = p_di_id
      AND (
        d.user_id = v_uid
        OR public.has_company_access(d.company_id)
        OR public.has_company_access(d.transportista_company_id)
        OR public.has_company_access(d.gestor_company_id)
        OR EXISTS (
          SELECT 1
          FROM public.companies c
          WHERE c.user_id = v_uid
            AND c.is_my_company = TRUE
            AND COALESCE(c.activo, TRUE) = TRUE
            AND (
              (d.productor_cif IS NOT NULL AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(d.productor_cif)))
              OR (d.transportista_cif IS NOT NULL AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(d.transportista_cif)))
              OR (d.gestor_cif IS NOT NULL AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(d.gestor_cif)))
            )
        )
      )
  ) INTO v_allowed;

  RETURN COALESCE(v_allowed, FALSE);
END;
$$;

GRANT EXECUTE ON FUNCTION public.has_di_participant_access(BIGINT) TO authenticated;

DO $$
BEGIN
  IF to_regclass('public.deca_documents') IS NOT NULL THEN
    DROP POLICY IF EXISTS "Users can view own DeCA documents" ON public.deca_documents;
    CREATE POLICY "Users can view own DeCA documents" ON public.deca_documents
      FOR SELECT USING (
        auth.uid() = user_id
        OR public.has_company_access(company_id)
        OR public.has_di_participant_access(identification_document_id)
        OR public.is_admin()
      );

    DROP POLICY IF EXISTS "Users can update own DeCA documents" ON public.deca_documents;
    CREATE POLICY "Users can update own DeCA documents" ON public.deca_documents
      FOR UPDATE USING (
        auth.uid() = user_id
        OR public.has_company_write_access(company_id)
        OR public.has_di_participant_access(identification_document_id)
        OR public.is_admin()
      );
  END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. A7-09: Permitir production_center_id NULL en memorias_anuales para Negociantes
-- ------------------------------------------------------------------------------
DO $$
BEGIN
  IF to_regclass('public.memorias_anuales') IS NOT NULL THEN
    ALTER TABLE public.memorias_anuales
      ALTER COLUMN production_center_id DROP NOT NULL;
  END IF;
END $$;
