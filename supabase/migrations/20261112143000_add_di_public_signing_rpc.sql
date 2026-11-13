-- ==============================================================================
-- FIRMA PÚBLICA POR TOKEN EN DOCUMENTOS DE IDENTIFICACIÓN (DI)
-- - Añade signing_token (UUID único) y signing_token_expires_at a identification_documents.
-- - La RPC de lectura devuelve el DI sin exponer credenciales sensibles de empresa.
-- - La RPC de firma permite registrar la firma gráfica, nombre y DNI del rol indicado
--   (productor, transportista o gestor) una única vez por rol, sin abrir RLS UPDATE anónimo.
-- ==============================================================================

ALTER TABLE public.identification_documents
  ADD COLUMN IF NOT EXISTS signing_token UUID DEFAULT gen_random_uuid();

UPDATE public.identification_documents
   SET signing_token = gen_random_uuid()
 WHERE signing_token IS NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_identification_documents_signing_token
  ON public.identification_documents (signing_token);

-- Sin DEFAULT inicial para que los DIs existentes conserven su enlace activo (NULL)
ALTER TABLE public.identification_documents
  ADD COLUMN IF NOT EXISTS signing_token_expires_at TIMESTAMPTZ;

-- Los nuevos DIs caducan su enlace público a los 30 días por defecto
ALTER TABLE public.identification_documents
  ALTER COLUMN signing_token_expires_at SET DEFAULT (now() + interval '30 days');

COMMENT ON COLUMN public.identification_documents.signing_token IS
  'Token único para permitir la firma pública del Documento de Identificación por rol (productor, transportista, gestor)';

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
    v_firmado_prod BOOLEAN;
    v_firmado_trans BOOLEAN;
    v_firmado_gest BOOLEAN;
BEGIN
    IF p_role NOT IN ('productor', 'transportista', 'gestor') THEN
        RAISE EXCEPTION 'Rol de firma inválido';
    END IF;

    SELECT id INTO v_id
      FROM public.identification_documents
     WHERE signing_token = p_token
       AND (signing_token_expires_at IS NULL OR signing_token_expires_at > now())
     LIMIT 1;

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

    -- Si las 3 partes han firmado y estaba en borrador/pendiente-firma, actualizar estado administrativo
    SELECT firmado_productor, firmado_transportista, firmado_gestor
      INTO v_firmado_prod, v_firmado_trans, v_firmado_gest
      FROM public.identification_documents
     WHERE id = v_id;

    IF v_firmado_prod AND v_firmado_trans AND v_firmado_gest THEN
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

    RETURN public.get_di_by_signing_token(p_token);
END;
$$;

REVOKE ALL ON FUNCTION public.get_di_by_signing_token(UUID) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.sign_di_by_signing_token(UUID, TEXT, TEXT, TEXT, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_di_by_signing_token(UUID) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.sign_di_by_signing_token(UUID, TEXT, TEXT, TEXT, TEXT) TO anon, authenticated;
