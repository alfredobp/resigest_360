-- ==============================================================================
-- RESIGEST 360 - ENDURECIMIENTO DE RPCs DE FIRMA PÚBLICA (CONTRATOS Y DI)
-- 1. Contratos: transiciona estado a pendiente_firma/vigente, bloquea cancelado/
--    finalizado e impide sobrescribir firmas PAdES previas (COALESCE(firmado_*, FALSE)).
-- 2. DI: verifica caducidad de token, bloquea cancelado/rechazado_total e impide
--    sobrescribir firmantes ya confirmados (COALESCE(firmado_*, FALSE)).
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.sign_contract_by_signing_token(
  p_token TEXT,
  p_role TEXT,
  p_signature_url TEXT,
  p_fecha TIMESTAMPTZ DEFAULT NOW()
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
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RAISE EXCEPTION 'Token de firma inválido';
  END IF;

  IF p_role NOT IN ('productor', 'gestor') THEN
    RAISE EXCEPTION 'Rol de firma inválido';
  END IF;

  SELECT *
  INTO v_contract
  FROM public.waste_contracts
  WHERE signing_token = p_token
    AND (signing_token_expires_at IS NULL OR signing_token_expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Contrato no encontrado o enlace de firma caducado';
  END IF;

  IF v_contract.estado IN ('cancelado', 'finalizado') THEN
    RAISE EXCEPTION 'No se puede firmar un contrato en estado %', v_contract.estado;
  END IF;

  IF p_role = 'productor' AND COALESCE(v_contract.firmado_productor, FALSE) = TRUE THEN
    RAISE EXCEPTION 'La parte productora ya ha firmado este contrato';
  END IF;

  IF p_role = 'gestor' AND COALESCE(v_contract.firmado_gestor, FALSE) = TRUE THEN
    RAISE EXCEPTION 'La parte gestora ya ha firmado este contrato';
  END IF;

  v_next_prod := CASE WHEN p_role = 'productor' THEN TRUE ELSE COALESCE(v_contract.firmado_productor, FALSE) END;
  v_next_gest := CASE WHEN p_role = 'gestor' THEN TRUE ELSE COALESCE(v_contract.firmado_gestor, FALSE) END;

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
      fecha_firma_productor = p_fecha,
      firmado_productor = TRUE,
      estado = v_next_estado,
      updated_at = NOW()
    WHERE id = v_contract.id
      AND COALESCE(firmado_productor, FALSE) = FALSE
    RETURNING * INTO v_updated;
  ELSE
    UPDATE public.waste_contracts
    SET
      firma_gestor_url = p_signature_url,
      fecha_firma_gestor = p_fecha,
      firmado_gestor = TRUE,
      estado = v_next_estado,
      updated_at = NOW()
    WHERE id = v_contract.id
      AND COALESCE(firmado_gestor, FALSE) = FALSE
    RETURNING * INTO v_updated;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Esta firma ya había sido registrada previamente';
  END IF;

  RETURN to_jsonb(v_updated);
END;
$$;

CREATE OR REPLACE FUNCTION public.sign_di_by_signing_token(
  p_token TEXT,
  p_role TEXT,
  p_signature_url TEXT,
  p_signer_name TEXT,
  p_signer_dni TEXT DEFAULT NULL,
  p_fecha TIMESTAMPTZ DEFAULT NOW()
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_doc public.identification_documents%ROWTYPE;
  v_updated public.identification_documents%ROWTYPE;
  v_all_signed BOOLEAN;
BEGIN
  IF p_token IS NULL OR length(trim(p_token)) < 16 THEN
    RAISE EXCEPTION 'Token de firma inválido';
  END IF;

  IF p_role NOT IN ('productor', 'transportista', 'gestor') THEN
    RAISE EXCEPTION 'Rol de firma inválido';
  END IF;

  SELECT *
  INTO v_doc
  FROM public.identification_documents
  WHERE signing_token = p_token
    AND (signing_token_expires_at IS NULL OR signing_token_expires_at > NOW())
  LIMIT 1;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Documento de Identificación no encontrado o enlace caducado';
  END IF;

  IF v_doc.estado = 'cancelado' OR v_doc.estado_traslado = 'rechazado_total' THEN
    RAISE EXCEPTION 'No se puede firmar un DI cancelado o rechazado totalmente';
  END IF;

  IF p_role = 'productor' THEN
    UPDATE public.identification_documents
    SET
      firma_productor_url = p_signature_url,
      nombre_productor_firmante = p_signer_name,
      dni_productor_firmante = p_signer_dni,
      fecha_firma_productor = p_fecha,
      firmado_productor = TRUE,
      updated_at = NOW()
    WHERE id = v_doc.id
      AND COALESCE(firmado_productor, FALSE) = FALSE
    RETURNING * INTO v_updated;
  ELSIF p_role = 'transportista' THEN
    UPDATE public.identification_documents
    SET
      firma_transportista_url = p_signature_url,
      nombre_transportista_firmante = p_signer_name,
      dni_transportista_firmante = p_signer_dni,
      fecha_firma_transportista = p_fecha,
      firmado_transportista = TRUE,
      updated_at = NOW()
    WHERE id = v_doc.id
      AND COALESCE(firmado_transportista, FALSE) = FALSE
    RETURNING * INTO v_updated;
  ELSE
    UPDATE public.identification_documents
    SET
      firma_gestor_url = p_signature_url,
      nombre_gestor_firmante = p_signer_name,
      dni_gestor_firmante = p_signer_dni,
      fecha_firma_gestor = p_fecha,
      firmado_gestor = TRUE,
      updated_at = NOW()
    WHERE id = v_doc.id
      AND COALESCE(firmado_gestor, FALSE) = FALSE
    RETURNING * INTO v_updated;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'La firma de % ya estaba registrada y bloqueada', p_role;
  END IF;

  v_all_signed :=
    COALESCE(v_updated.firmado_productor, FALSE)
    AND COALESCE(v_updated.firmado_transportista, FALSE)
    AND COALESCE(v_updated.firmado_gestor, FALSE);

  IF v_all_signed AND v_updated.estado <> 'completado' THEN
    UPDATE public.identification_documents
    SET estado = 'completado', updated_at = NOW()
    WHERE id = v_updated.id
    RETURNING * INTO v_updated;
  END IF;

  RETURN to_jsonb(v_updated);
END;
$$;

