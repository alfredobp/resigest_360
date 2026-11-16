-- ==============================================================================
-- ENDURECIMIENTO RLS EN DECA_DOCUMENTS Y ACCESO PÚBLICO POR TOKEN VÍA RPC
-- - Elimina la política abierta USING (true) en public.deca_documents que permitía
--   listar todos los DeCA de todos los tenants con la clave anónima.
-- - Crea la RPC SECURITY DEFINER public.get_deca_by_token(p_token TEXT) para que
--   la inspección en carretera (/api/deca/[token]) y la vista móvil del conductor
--   (/mobile/deca/[token]) consulten exclusivamente el documento asociado al token.
-- ==============================================================================

DROP POLICY IF EXISTS "Permitir lectura publica por token" ON public.deca_documents;

DROP POLICY IF EXISTS "Users can view own DeCA documents" ON public.deca_documents;
CREATE POLICY "Users can view own DeCA documents" ON public.deca_documents
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(company_id)
    OR public.is_admin()
  );

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

    SELECT to_jsonb(d) INTO v_result
    FROM public.deca_documents d
    WHERE d.token = btrim(p_token)
    LIMIT 1;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_deca_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_deca_by_token(TEXT) TO anon, authenticated, service_role;

-- N05: Obtener la versión vigente activa de un DeCA a partir del token de una versión histórica sin requerir login
CREATE OR REPLACE FUNCTION public.get_active_deca_by_token(p_token TEXT)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_base_numero TEXT;
    v_user_id UUID;
    v_result JSONB;
BEGIN
    IF p_token IS NULL OR length(btrim(p_token)) = 0 THEN
        RETURN NULL;
    END IF;

    SELECT regexp_replace(numero_deca, '-v[0-9]+$', ''), user_id
      INTO v_base_numero, v_user_id
      FROM public.deca_documents
     WHERE token = btrim(p_token)
     LIMIT 1;

    IF v_base_numero IS NULL THEN
        RETURN NULL;
    END IF;

    SELECT to_jsonb(d) INTO v_result
      FROM public.deca_documents d
     WHERE regexp_replace(d.numero_deca, '-v[0-9]+$', '') = v_base_numero
       AND (v_user_id IS NULL OR d.user_id = v_user_id)
       AND d.is_vigente = true
     ORDER BY d.version DESC
     LIMIT 1;

    RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_active_deca_by_token(TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.get_active_deca_by_token(TEXT) TO anon, authenticated, service_role;


