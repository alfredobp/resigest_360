-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN DE SEGURIDAD Y SOPORTE PARA FIRMA PÚBLICA DE DI
-- Resuelve Incidencia N01: Subida de firma pública sin sesión autenticada
-- ==============================================================================

BEGIN;

-- 1. Asegurar columna signing_token en identification_documents
ALTER TABLE public.identification_documents
    ADD COLUMN IF NOT EXISTS signing_token UUID DEFAULT gen_random_uuid(),
    ADD COLUMN IF NOT EXISTS signing_token_expires_at TIMESTAMPTZ;

-- Backfill de signing_token para DIs existentes que no lo tengan
UPDATE public.identification_documents
SET signing_token = gen_random_uuid()
WHERE signing_token IS NULL;

-- Índice para búsqueda rápida y segura por signing_token
CREATE INDEX IF NOT EXISTS idx_di_signing_token 
    ON public.identification_documents(signing_token);

-- 2. Función RPC para obtener DI por signing_token sin filtrar otros expedientes
DROP FUNCTION IF EXISTS public.get_di_by_signing_token(uuid);
DROP FUNCTION IF EXISTS public.get_di_by_signing_token;

CREATE OR REPLACE FUNCTION public.get_di_by_signing_token(p_token uuid)
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

-- 3. Función RPC para registrar la firma pública con verificación estricta de parte
DROP FUNCTION IF EXISTS public.sign_di_by_signing_token(uuid, text, text, text, text);
DROP FUNCTION IF EXISTS public.sign_di_by_signing_token(uuid, text, text);
DROP FUNCTION IF EXISTS public.sign_di_by_signing_token;

CREATE OR REPLACE FUNCTION public.sign_di_by_signing_token(
    p_token uuid,
    p_role text,
    p_signature_url text,
    p_signer_name text,
    p_signer_dni text
)
RETURNS JSONB AS $$
DECLARE
    v_di public.identification_documents%ROWTYPE;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    SELECT * INTO v_di
    FROM public.identification_documents
    WHERE signing_token = p_token
    FOR UPDATE;

    IF NOT FOUND THEN
        RAISE EXCEPTION 'Documento de Identificación no encontrado para el token proporcionado.';
    END IF;

    IF p_role = 'productor' THEN
        IF v_di.firmado_productor AND v_di.firma_productor_url IS NOT NULL THEN
            RAISE EXCEPTION 'La parte Productor ya ha firmado este documento y no puede ser sobrescrita.';
        END IF;
        UPDATE public.identification_documents
        SET 
            firmado_productor = TRUE,
            firma_productor_url = p_signature_url,
            fecha_firma_productor = v_now,
            nombre_productor = COALESCE(NULLIF(TRIM(p_signer_name), ''), nombre_productor),
            dni_productor = COALESCE(NULLIF(TRIM(p_signer_dni), ''), dni_productor),
            updated_at = v_now
        WHERE id = v_di.id;

    ELSIF p_role = 'transportista' THEN
        IF v_di.firmado_transportista AND v_di.firma_transportista_url IS NOT NULL THEN
            RAISE EXCEPTION 'La parte Transportista ya ha firmado este documento y no puede ser sobrescrita.';
        END IF;
        UPDATE public.identification_documents
        SET 
            firmado_transportista = TRUE,
            firma_transportista_url = p_signature_url,
            fecha_firma_transportista = v_now,
            nombre_transportista = COALESCE(NULLIF(TRIM(p_signer_name), ''), nombre_transportista),
            dni_transportista = COALESCE(NULLIF(TRIM(p_signer_dni), ''), dni_transportista),
            updated_at = v_now
        WHERE id = v_di.id;

    ELSIF p_role = 'gestor' THEN
        IF v_di.firmado_gestor AND v_di.firma_gestor_url IS NOT NULL THEN
            RAISE EXCEPTION 'La parte Gestor ya ha firmado este documento y no puede ser sobrescrita.';
        END IF;
        UPDATE public.identification_documents
        SET 
            firmado_gestor = TRUE,
            firma_gestor_url = p_signature_url,
            fecha_firma_gestor = v_now,
            nombre_gestor = COALESCE(NULLIF(TRIM(p_signer_name), ''), nombre_gestor),
            dni_gestor = COALESCE(NULLIF(TRIM(p_signer_dni), ''), dni_gestor),
            updated_at = v_now
        WHERE id = v_di.id;

    ELSE
        RAISE EXCEPTION 'Rol de firma no válido: %', p_role;
    END IF;

    RETURN public.get_di_by_signing_token(p_token);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Storage Policy para permitir la subida de firmas de DI y contratos
DROP POLICY IF EXISTS "Public can upload signatures" ON storage.objects;
CREATE POLICY "Public can upload signatures"
ON storage.objects FOR INSERT
TO public
WITH CHECK (
    bucket_id = 'images'
    AND (storage.foldername(name))[1] IN ('identification_documents', 'contracts')
);

COMMIT;

