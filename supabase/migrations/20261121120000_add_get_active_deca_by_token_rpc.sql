-- ==============================================================================
-- RESIGEST 360 - RPC SECURITY DEFINER PARA RESOLVER VERSIÓN VIGENTE DE DeCA
-- Permite al conductor sin sesión autenticada que abre un enlace DeCA histórico
-- (v1 sustituido) descubrir y navegar a la revisión vigente actual (v2+).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.get_active_deca_by_token(p_token TEXT)
RETURNS SETOF public.deca_documents
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.deca_documents%ROWTYPE;
  v_base_numero TEXT;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) = 0 THEN
    RETURN;
  END IF;

  SELECT *
  INTO v_doc
  FROM public.deca_documents
  WHERE token = p_token
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN;
  END IF;

  -- Si el documento consultado ya es vigente, devolverlo directamente
  IF v_doc.is_vigente IS TRUE THEN
    RETURN NEXT v_doc;
    RETURN;
  END IF;

  -- Resolver familia documental por numero_deca base dentro del mismo tenant
  v_base_numero := regexp_replace(COALESCE(v_doc.numero_deca, ''), '-v\d+$', '');

  IF length(trim(v_base_numero)) = 0 THEN
    RETURN;
  END IF;

  RETURN QUERY
  SELECT d.*
  FROM public.deca_documents d
  WHERE d.user_id = v_doc.user_id
    AND (
      (v_doc.company_id IS NOT NULL AND d.company_id = v_doc.company_id)
      OR (v_doc.company_id IS NULL)
    )
    AND d.is_vigente IS TRUE
    AND d.numero_deca ILIKE (v_base_numero || '%')
  ORDER BY d.version DESC, d.id DESC
  LIMIT 1;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_active_deca_by_token(TEXT) TO anon, authenticated;

