-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN DE CORRECCIONES DE AUDITORÍA (2026-11-10)
-- Incidencias cubiertas: F01, F02, F03, F04, F05, F08, F13
-- ==============================================================================
-- NOTA: Script idempotente diseñado para preservar todos los registros existentes
-- (incluidos los registros de ensayo de auditoría: B00000000, DI 115, etc.).
-- Incluye instrucciones de verificación de huérfanos y bloque de reversión al final.

BEGIN;

-- ------------------------------------------------------------------------------
-- 1. F01 — Contratos: garantizar gestor_company_id y saneamiento sin eliminar FK
-- ------------------------------------------------------------------------------
ALTER TABLE public.waste_contracts
    ADD COLUMN IF NOT EXISTS gestor_company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL;

-- Tabla de correspondencia auditable entre treatment_managers legacy y companies
CREATE TABLE IF NOT EXISTS public.treatment_manager_company_map (
    treatment_manager_id BIGINT PRIMARY KEY REFERENCES public.treatment_managers(id) ON DELETE CASCADE,
    company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    migrated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.treatment_manager_company_map ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "tm_company_map_select_own" ON public.treatment_manager_company_map;
CREATE POLICY "tm_company_map_select_own" ON public.treatment_manager_company_map
    FOR SELECT USING (auth.uid() = user_id);

-- Poblar correspondencias por (user_id, CIF)
INSERT INTO public.treatment_manager_company_map (treatment_manager_id, company_id, user_id)
SELECT tm.id, c.id, tm.user_id
FROM public.treatment_managers tm
JOIN public.companies c
  ON c.user_id = tm.user_id
 AND UPPER(TRIM(c.cif)) = UPPER(TRIM(tm.cif))
ON CONFLICT (treatment_manager_id) DO NOTHING;

-- Completar gestor_company_id en contratos legacy que solo tenían treatment_manager_id
UPDATE public.waste_contracts wc
SET gestor_company_id = m.company_id
FROM public.treatment_manager_company_map m
WHERE wc.treatment_manager_id = m.treatment_manager_id
  AND wc.gestor_company_id IS NULL;

-- ------------------------------------------------------------------------------
-- 2. F02 / F03 / F13 — Documentos de Identificación (DI)
-- ------------------------------------------------------------------------------
-- F02: Conservar separada la operación prevista (operacion_tratamiento) y la ejecutada
ALTER TABLE public.identification_documents
    ADD COLUMN IF NOT EXISTS operacion_tratamiento_ejecutada VARCHAR(10);

-- Backfill seguro para DIs ya cerrados: preservar su operación cerrada como ejecutada
UPDATE public.identification_documents
SET operacion_tratamiento_ejecutada = operacion_tratamiento
WHERE operacion_tratamiento_ejecutada IS NULL
  AND operacion_tratamiento IS NOT NULL
  AND (estado_traslado IN ('tratado') OR estado = 'completado');

-- F03: Acreditación alternativa de contrato externo cuando el contrato no reside en la cuenta
ALTER TABLE public.identification_documents
    ADD COLUMN IF NOT EXISTS contrato_externo_referencia TEXT,
    ADD COLUMN IF NOT EXISTS contrato_externo_evidencia_url TEXT,
    ADD COLUMN IF NOT EXISTS supuesto_excepcion_contrato TEXT;

-- F13: Convertir fecha_firma_productor, fecha_firma_gestor y fecha_firma_transportista
-- de DATE a TIMESTAMPTZ para conservar la hora y minutos exactos
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'identification_documents'
          AND column_name = 'fecha_firma_productor'
          AND data_type = 'date'
    ) THEN
        ALTER TABLE public.identification_documents
            ALTER COLUMN fecha_firma_productor TYPE TIMESTAMPTZ
            USING (fecha_firma_productor::timestamp AT TIME ZONE 'Europe/Madrid');
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'identification_documents'
          AND column_name = 'fecha_firma_gestor'
          AND data_type = 'date'
    ) THEN
        ALTER TABLE public.identification_documents
            ALTER COLUMN fecha_firma_gestor TYPE TIMESTAMPTZ
            USING (fecha_firma_gestor::timestamp AT TIME ZONE 'Europe/Madrid');
    END IF;

    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'identification_documents'
          AND column_name = 'fecha_firma_transportista'
          AND data_type = 'date'
    ) THEN
        ALTER TABLE public.identification_documents
            ALTER COLUMN fecha_firma_transportista TYPE TIMESTAMPTZ
            USING (fecha_firma_transportista::timestamp AT TIME ZONE 'Europe/Madrid');
    END IF;
END $$;

-- ------------------------------------------------------------------------------
-- 3. F04 — Operaciones Comerciales: numeración por tenant/empresa e idempotencia
-- ------------------------------------------------------------------------------
ALTER TABLE public.commercial_operations
    ADD COLUMN IF NOT EXISTS idempotency_key TEXT;

-- Eliminar la restricción UNIQUE global que provoca colisiones entre usuarios/empresas
ALTER TABLE public.commercial_operations
    DROP CONSTRAINT IF EXISTS commercial_operations_numero_operacion_key;

DROP INDEX IF EXISTS commercial_operations_numero_operacion_key;

-- Restricción única por tenant y empresa (COALESCE(company_id, 0) si es nula)
CREATE UNIQUE INDEX IF NOT EXISTS idx_commercial_ops_tenant_numero_unique
    ON public.commercial_operations (user_id, COALESCE(company_id, 0), numero_operacion);

-- Clave de idempotencia única por usuario cuando se proporcione
CREATE UNIQUE INDEX IF NOT EXISTS idx_commercial_ops_idempotency_unique
    ON public.commercial_operations (user_id, idempotency_key)
    WHERE idempotency_key IS NOT NULL;

-- ------------------------------------------------------------------------------
-- 4. F05 — DeCA: unicidad por usuario + versión y soporte de token de inspección
-- ------------------------------------------------------------------------------
ALTER TABLE public.deca_documents
    DROP CONSTRAINT IF EXISTS deca_documents_numero_deca_key,
    DROP CONSTRAINT IF EXISTS deca_documents_numero_version_key;

DROP INDEX IF EXISTS deca_documents_numero_deca_key;

CREATE UNIQUE INDEX IF NOT EXISTS idx_deca_user_numero_version_unique
    ON public.deca_documents (user_id, numero_deca, version);

-- ------------------------------------------------------------------------------
-- 5. F08 — Pista de Auditoría Legal: aislamiento estricto por usuario/empresa
-- ------------------------------------------------------------------------------
ALTER TABLE public.audit_logs
    DROP CONSTRAINT IF EXISTS audit_logs_entidad_check;

ALTER TABLE public.audit_logs
    ADD CONSTRAINT audit_logs_entidad_check CHECK (
        entidad IN (
            'di',
            'contrato',
            'operacion_comercial',
            'empresa',
            'centro_produccion',
            'archivo_cronologico',
            'memoria_anual',
            'autorizacion',
            'deca',
            'integracion_sira',
            'integracion_holded'
        )
    );

DROP POLICY IF EXISTS "audit_logs_select_authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_select_own_tenant" ON public.audit_logs;
CREATE POLICY "audit_logs_select_own_tenant" ON public.audit_logs
    FOR SELECT USING (
        auth.uid() = user_id
        OR EXISTS (
            SELECT 1 FROM public.companies c
            WHERE c.id = audit_logs.company_id
              AND c.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "audit_logs_insert_authenticated" ON public.audit_logs;
DROP POLICY IF EXISTS "audit_logs_insert_own_tenant" ON public.audit_logs;
CREATE POLICY "audit_logs_insert_own_tenant" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL AND (user_id IS NULL OR user_id = auth.uid()));

COMMIT;

-- ==============================================================================
-- VERIFICACIÓN DE HUÉRFANOS (ejecutar tras aplicar):
-- SELECT COUNT(*) AS contratos_sin_gestor
--   FROM public.waste_contracts
--  WHERE treatment_manager_id IS NULL AND gestor_company_id IS NULL;
--
-- REVERSIÓN (en caso de necesitar revertir índices/columnas):
-- DROP INDEX IF EXISTS idx_deca_user_numero_version_unique;
-- DROP INDEX IF EXISTS idx_commercial_ops_idempotency_unique;
-- DROP INDEX IF EXISTS idx_commercial_ops_tenant_numero_unique;
-- ALTER TABLE public.identification_documents
--   DROP COLUMN IF EXISTS operacion_tratamiento_ejecutada,
--   DROP COLUMN IF EXISTS contrato_externo_referencia,
--   DROP COLUMN IF EXISTS contrato_externo_evidencia_url,
--   DROP COLUMN IF EXISTS supuesto_excepcion_contrato;
-- ==============================================================================

