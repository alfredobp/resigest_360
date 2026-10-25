-- ==============================================================================
-- ENDURECIMIENTO DE LA FIRMA PÚBLICA DE CONTRATOS POR TOKEN
-- - La RPC de lectura ya no devuelve credenciales de empresa (SIRA / Holded).
-- - Los tokens pueden caducar (columna signing_token_expires_at; NULL = sin caducidad
--   para contratos existentes) y los nuevos caducan a los 30 días.
-- - search_path fijado y permisos explícitos sobre las funciones SECURITY DEFINER.
-- - Nueva RPC de firma: solo permite escribir los campos de firma del rol indicado,
--   una única vez por rol, sin conceder UPDATE directo a usuarios anónimos.
-- NOTA: este script NO se ha ejecutado; aplicar manualmente en Supabase.
-- ==============================================================================

-- Sin DEFAULT al crearla: los contratos existentes conservan su enlace sin caducidad (NULL)
ALTER TABLE public.waste_contracts
  ADD COLUMN IF NOT EXISTS signing_token_expires_at TIMESTAMPTZ;

-- Solo las filas nuevas caducan a los 30 días
ALTER TABLE public.waste_contracts
  ALTER COLUMN signing_token_expires_at SET DEFAULT (now() + interval '30 days');

CREATE OR REPLACE FUNCTION public.get_contract_by_signing_token(p_token UUID)
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
            wc.*,
            to_jsonb(p) - 'holded_api_key' - 'sira_usuario' - 'sira_password' - 'user_id' AS company,
            to_jsonb(g) - 'holded_api_key' - 'sira_usuario' - 'sira_password' - 'user_id' AS gestor_company,
            to_jsonb(tm) AS treatment_manager
        FROM public.waste_contracts wc
        LEFT JOIN public.companies p ON wc.company_id = p.id
        LEFT JOIN public.companies g ON wc.gestor_company_id = g.id
        LEFT JOIN public.treatment_managers tm ON wc.treatment_manager_id = tm.id
        WHERE wc.signing_token = p_token
          AND (wc.signing_token_expires_at IS NULL OR wc.signing_token_expires_at > now())
        LIMIT 1
    ) t;
    RETURN v_result;
END;
$$;

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
           SET firma_productor_url = p_signature_url, fecha_firma_productor = now()
         WHERE id = v_id AND firma_productor_url IS NULL;
    ELSE
        UPDATE public.waste_contracts
           SET firma_gestor_url = p_signature_url, fecha_firma_gestor = now()
         WHERE id = v_id AND firma_gestor_url IS NULL;
    END IF;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'El contrato ya fue firmado por este rol';
    END IF;

    RETURN public.get_contract_by_signing_token(p_token);
END;
$$;

REVOKE ALL ON FUNCTION public.get_contract_by_signing_token(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sign_contract_by_signing_token(UUID, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_contract_by_signing_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_contract_by_signing_token(UUID, TEXT, TEXT) TO anon, authenticated;
