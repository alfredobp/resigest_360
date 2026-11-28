-- ==============================================================================
-- RESIGEST 360 - NUMERACIÓN CONSECUTIVA, COHERENTE POR EMPRESA E INMUTABLE
-- Entidades: Contratos (waste_contracts), DI (identification_documents) y
--            Notificaciones Previas (prior_notifications)
-- Formatos:
--   - Contrato: CT-{CIF}-{AÑO}-{CORRELATIVO 6 dígitos}
--   - DI (E3L 3.3): DCS{ORIGEN 2}{NIMA 10}{AÑO 4}{CORRELATIVO 7 dígitos}
--   - NT (E3L 3.3): NT{ORIGEN 2}{NIMA 10}{AÑO 4}{CORRELATIVO 7 dígitos}
-- Reinicio anual por empresa y tipo de documento. Inmutabilidad en BD.
-- ==============================================================================

BEGIN;

-- 1. Tabla de secuencias atómicas por empresa, tipo de documento y año natural
CREATE TABLE IF NOT EXISTS public.company_document_sequences (
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  doc_type TEXT NOT NULL CHECK (doc_type IN ('contract', 'di', 'nt')),
  year INTEGER NOT NULL CHECK (year >= 2000 AND year <= 2100),
  last_value INTEGER NOT NULL DEFAULT 0 CHECK (last_value >= 0),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (company_id, doc_type, year)
);

CREATE INDEX IF NOT EXISTS idx_company_document_sequences_lookup
  ON public.company_document_sequences(company_id, doc_type, year);

ALTER TABLE public.company_document_sequences ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "company_document_sequences_select" ON public.company_document_sequences;
CREATE POLICY "company_document_sequences_select" ON public.company_document_sequences
  FOR SELECT
  USING (
    public.is_admin()
    OR public.has_company_access(company_id)
  );

-- 2. Helpers deterministas de normalización y formateo
CREATE OR REPLACE FUNCTION public.normalize_company_code_tag(
  p_cif TEXT,
  p_company_id BIGINT
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_clean TEXT;
BEGIN
  v_clean := regexp_replace(upper(trim(COALESCE(p_cif, ''))), '[^A-Z0-9]', '', 'g');
  IF length(v_clean) > 0 THEN
    RETURN v_clean;
  END IF;
  RETURN 'EMP' || COALESCE(p_company_id::TEXT, '0');
END;
$$;

CREATE OR REPLACE FUNCTION public.format_company_document_code(
  p_doc_type TEXT,
  p_identifier TEXT,
  p_year INTEGER,
  p_seq INTEGER
)
RETURNS TEXT
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_year TEXT;
  v_seq INTEGER;
  v_digits TEXT;
  v_nima TEXT;
  v_origin TEXT;
  v_tag TEXT;
BEGIN
  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER)::TEXT;
  v_seq := GREATEST(COALESCE(p_seq, 1), 1);

  IF p_doc_type = 'contract' THEN
    v_tag := regexp_replace(upper(trim(COALESCE(p_identifier, ''))), '[^A-Z0-9]', '', 'g');
    IF length(v_tag) = 0 THEN
      v_tag := 'EMP';
    END IF;
    RETURN 'CT-' || v_tag || '-' || v_year || '-' || lpad(v_seq::TEXT, 6, '0');
  END IF;

  IF p_doc_type IN ('di', 'nt') THEN
    v_digits := regexp_replace(COALESCE(p_identifier, ''), '\D', '', 'g');
    IF v_digits ~ '^(0[1-9]|[1-4][0-9]|5[0-2])\d{8}$' THEN
      v_nima := v_digits;
      v_origin := '10';
    ELSE
      v_nima := '9999999999';
      v_origin := '01';
    END IF;

    IF p_doc_type = 'di' THEN
      RETURN 'DCS' || v_origin || v_nima || v_year || lpad(v_seq::TEXT, 7, '0');
    ELSE
      RETURN 'NT' || v_origin || v_nima || v_year || lpad(v_seq::TEXT, 7, '0');
    END IF;
  END IF;

  RAISE EXCEPTION 'Tipo de documento no soportado para numeración: %', p_doc_type;
END;
$$;

-- 3. Función interna atómica de asignación (incrementa contador bajo lock de fila)
CREATE OR REPLACE FUNCTION public.allocate_company_document_code(
  p_company_id BIGINT,
  p_doc_type TEXT,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  p_nima TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_next_seq INTEGER;
  v_cif TEXT;
  v_company_nima TEXT;
  v_identifier TEXT;
BEGIN
  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id es obligatorio para generar un código consecutivo';
  END IF;

  IF p_doc_type NOT IN ('contract', 'di', 'nt') THEN
    RAISE EXCEPTION 'doc_type inválido: %', p_doc_type;
  END IF;

  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  SELECT c.cif, c.nima
    INTO v_cif, v_company_nima
    FROM public.companies c
   WHERE c.id = p_company_id;

  INSERT INTO public.company_document_sequences (company_id, doc_type, year, last_value, updated_at)
  VALUES (p_company_id, p_doc_type, v_year, 1, NOW())
  ON CONFLICT (company_id, doc_type, year)
  DO UPDATE SET
    last_value = public.company_document_sequences.last_value + 1,
    updated_at = NOW()
  RETURNING last_value INTO v_next_seq;

  IF p_doc_type = 'contract' THEN
    v_identifier := public.normalize_company_code_tag(v_cif, p_company_id);
  ELSE
    v_identifier := COALESCE(NULLIF(trim(COALESCE(p_nima, '')), ''), v_company_nima, '');
  END IF;

  RETURN public.format_company_document_code(p_doc_type, v_identifier, v_year, v_next_seq);
END;
$$;

REVOKE ALL ON FUNCTION public.allocate_company_document_code(BIGINT, TEXT, INTEGER, TEXT) FROM PUBLIC;

-- 4. RPC pública (autenticada) de vista previa sin consumir contador
CREATE OR REPLACE FUNCTION public.preview_company_document_code(
  p_company_id BIGINT,
  p_doc_type TEXT,
  p_year INTEGER DEFAULT EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER,
  p_nima TEXT DEFAULT NULL
)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_last_val INTEGER;
  v_cif TEXT;
  v_company_nima TEXT;
  v_identifier TEXT;
BEGIN
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'Usuario no autenticado';
  END IF;

  IF p_company_id IS NULL THEN
    RAISE EXCEPTION 'company_id es obligatorio para previsualizar el código';
  END IF;

  IF p_doc_type NOT IN ('contract', 'di', 'nt') THEN
    RAISE EXCEPTION 'doc_type inválido: %', p_doc_type;
  END IF;

  IF NOT (public.is_admin() OR public.has_company_access(p_company_id)) THEN
    RAISE EXCEPTION 'Sin permisos para consultar la secuencia de la empresa %', p_company_id;
  END IF;

  v_year := COALESCE(p_year, EXTRACT(YEAR FROM CURRENT_DATE)::INTEGER);

  SELECT c.cif, c.nima
    INTO v_cif, v_company_nima
    FROM public.companies c
   WHERE c.id = p_company_id;

  SELECT s.last_value
    INTO v_last_val
    FROM public.company_document_sequences s
   WHERE s.company_id = p_company_id
     AND s.doc_type = p_doc_type
     AND s.year = v_year;

  IF p_doc_type = 'contract' THEN
    v_identifier := public.normalize_company_code_tag(v_cif, p_company_id);
  ELSE
    v_identifier := COALESCE(NULLIF(trim(COALESCE(p_nima, '')), ''), v_company_nima, '');
  END IF;

  RETURN public.format_company_document_code(p_doc_type, v_identifier, v_year, COALESCE(v_last_val, 0) + 1);
END;
$$;

REVOKE ALL ON FUNCTION public.preview_company_document_code(BIGINT, TEXT, INTEGER, TEXT) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.preview_company_document_code(BIGINT, TEXT, INTEGER, TEXT) TO authenticated;

-- 5. Backfill inicial de contadores existentes por empresa y año
INSERT INTO public.company_document_sequences (company_id, doc_type, year, last_value, updated_at)
SELECT
  wc.company_id,
  'contract' AS doc_type,
  EXTRACT(YEAR FROM COALESCE(wc.fecha_contrato::DATE, wc.created_at::DATE, CURRENT_DATE))::INTEGER AS year,
  GREATEST(
    COUNT(*)::INTEGER,
    COALESCE(
      MAX(
        CASE
          WHEN wc.numero_contrato ~ '^CT-[A-Z0-9]+-\d{4}-\d{6}$'
            THEN right(wc.numero_contrato, 6)::INTEGER
          ELSE 0
        END
      ),
      0
    )
  ) AS last_value,
  NOW()
FROM public.waste_contracts wc
WHERE wc.company_id IS NOT NULL
GROUP BY wc.company_id, EXTRACT(YEAR FROM COALESCE(wc.fecha_contrato::DATE, wc.created_at::DATE, CURRENT_DATE))::INTEGER
ON CONFLICT (company_id, doc_type, year)
DO UPDATE SET
  last_value = GREATEST(public.company_document_sequences.last_value, EXCLUDED.last_value),
  updated_at = NOW();

INSERT INTO public.company_document_sequences (company_id, doc_type, year, last_value, updated_at)
SELECT
  di.company_id,
  'di' AS doc_type,
  EXTRACT(YEAR FROM COALESCE(di.fecha_documento::DATE, di.created_at::DATE, CURRENT_DATE))::INTEGER AS year,
  GREATEST(
    COUNT(*)::INTEGER,
    COALESCE(
      MAX(
        CASE
          WHEN di.numero_documento ~ '^DCS\d{16}\d{7}$'
            THEN right(di.numero_documento, 7)::INTEGER
          ELSE 0
        END
      ),
      0
    )
  ) AS last_value,
  NOW()
FROM public.identification_documents di
WHERE di.company_id IS NOT NULL
GROUP BY di.company_id, EXTRACT(YEAR FROM COALESCE(di.fecha_documento::DATE, di.created_at::DATE, CURRENT_DATE))::INTEGER
ON CONFLICT (company_id, doc_type, year)
DO UPDATE SET
  last_value = GREATEST(public.company_document_sequences.last_value, EXCLUDED.last_value),
  updated_at = NOW();

INSERT INTO public.company_document_sequences (company_id, doc_type, year, last_value, updated_at)
SELECT
  pn.company_id,
  'nt' AS doc_type,
  EXTRACT(YEAR FROM COALESCE(pn.fecha_notificacion::DATE, pn.created_at::DATE, CURRENT_DATE))::INTEGER AS year,
  GREATEST(
    COUNT(*)::INTEGER,
    COALESCE(
      MAX(
        CASE
          WHEN pn.numero_notificacion ~ '^NT\d{16}\d{7}$'
            THEN right(pn.numero_notificacion, 7)::INTEGER
          ELSE 0
        END
      ),
      0
    )
  ) AS last_value,
  NOW()
FROM public.prior_notifications pn
WHERE pn.company_id IS NOT NULL
GROUP BY pn.company_id, EXTRACT(YEAR FROM COALESCE(pn.fecha_notificacion::DATE, pn.created_at::DATE, CURRENT_DATE))::INTEGER
ON CONFLICT (company_id, doc_type, year)
DO UPDATE SET
  last_value = GREATEST(public.company_document_sequences.last_value, EXCLUDED.last_value),
  updated_at = NOW();

-- 6. Triggers BEFORE INSERT (asignación autoritativa y consecutiva) y BEFORE UPDATE (inmutabilidad)

-- 6.1 Contratos (waste_contracts)
CREATE OR REPLACE FUNCTION public.trg_waste_contracts_code_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.company_id IS NOT NULL THEN
      v_year := EXTRACT(YEAR FROM COALESCE(NEW.fecha_contrato::DATE, CURRENT_DATE))::INTEGER;
      NEW.numero_contrato := public.allocate_company_document_code(NEW.company_id, 'contract', v_year, NULL);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.numero_contrato IS NOT NULL
       AND trim(OLD.numero_contrato) <> ''
       AND NEW.numero_contrato IS DISTINCT FROM OLD.numero_contrato THEN
      RAISE EXCEPTION 'El número de contrato (%) es inmutable y no puede modificarse una vez emitido.', OLD.numero_contrato;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_waste_contracts_code_guard ON public.waste_contracts;
CREATE TRIGGER trg_waste_contracts_code_guard
  BEFORE INSERT OR UPDATE ON public.waste_contracts
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_waste_contracts_code_guard();

-- 6.2 Documentos de Identificación (identification_documents)
CREATE OR REPLACE FUNCTION public.trg_identification_documents_code_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_nima TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.company_id IS NOT NULL THEN
      v_year := EXTRACT(YEAR FROM COALESCE(NEW.fecha_documento::DATE, CURRENT_DATE))::INTEGER;
      v_nima := COALESCE(NULLIF(trim(COALESCE(NEW.productor_nima, '')), ''), NULLIF(trim(COALESCE(NEW.gestor_nima, '')), ''));
      NEW.numero_documento := public.allocate_company_document_code(NEW.company_id, 'di', v_year, v_nima);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.numero_documento IS NOT NULL
       AND trim(OLD.numero_documento) <> ''
       AND NEW.numero_documento IS DISTINCT FROM OLD.numero_documento THEN
      RAISE EXCEPTION 'El número de Documento de Identificación (%) es inmutable y no puede modificarse una vez emitido.', OLD.numero_documento;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_identification_documents_code_guard ON public.identification_documents;
CREATE TRIGGER trg_identification_documents_code_guard
  BEFORE INSERT OR UPDATE ON public.identification_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_identification_documents_code_guard();

-- 6.3 Notificaciones Previas (prior_notifications)
CREATE OR REPLACE FUNCTION public.trg_prior_notifications_code_guard()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_year INTEGER;
  v_nima TEXT;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.company_id IS NOT NULL THEN
      v_year := EXTRACT(YEAR FROM COALESCE(NEW.fecha_notificacion::DATE, CURRENT_DATE))::INTEGER;
      v_nima := COALESCE(NULLIF(trim(COALESCE(NEW.productor_nima, '')), ''), NULLIF(trim(COALESCE(NEW.operador_nima, '')), ''));
      NEW.numero_notificacion := public.allocate_company_document_code(NEW.company_id, 'nt', v_year, v_nima);
    END IF;
    RETURN NEW;
  END IF;

  IF TG_OP = 'UPDATE' THEN
    IF OLD.numero_notificacion IS NOT NULL
       AND trim(OLD.numero_notificacion) <> ''
       AND NEW.numero_notificacion IS DISTINCT FROM OLD.numero_notificacion THEN
      RAISE EXCEPTION 'El código de Notificación Previa (%) es inmutable y no puede modificarse una vez emitido.', OLD.numero_notificacion;
    END IF;
    RETURN NEW;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_prior_notifications_code_guard ON public.prior_notifications;
CREATE TRIGGER trg_prior_notifications_code_guard
  BEFORE INSERT OR UPDATE ON public.prior_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.trg_prior_notifications_code_guard();

-- 7. Índices de unicidad por empresa (creados de forma segura si no existen duplicados históricos)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.waste_contracts
    WHERE company_id IS NOT NULL AND numero_contrato IS NOT NULL
    GROUP BY company_id, numero_contrato HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_waste_contracts_company_numero
      ON public.waste_contracts(company_id, numero_contrato)
      WHERE numero_contrato IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.identification_documents
    WHERE company_id IS NOT NULL AND numero_documento IS NOT NULL
    GROUP BY company_id, numero_documento HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_identification_documents_company_numero
      ON public.identification_documents(company_id, numero_documento)
      WHERE numero_documento IS NOT NULL;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM public.prior_notifications
    WHERE company_id IS NOT NULL AND numero_notificacion IS NOT NULL
    GROUP BY company_id, numero_notificacion HAVING COUNT(*) > 1
  ) THEN
    CREATE UNIQUE INDEX IF NOT EXISTS uq_prior_notifications_company_numero
      ON public.prior_notifications(company_id, numero_notificacion)
      WHERE numero_notificacion IS NOT NULL;
  END IF;
END;
$$;

COMMENT ON TABLE public.company_document_sequences IS 'Secuencias atómicas por empresa, tipo de documento (contract, di, nt) y año natural para garantizar numeración consecutiva sin colisiones.';

COMMIT;

