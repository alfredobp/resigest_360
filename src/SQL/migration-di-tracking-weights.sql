-- ========================================================================
-- MIGRATION: IDENTIFICATION DOCUMENTS - TRACKING, SCALE WEIGHTS & CLOSURE
-- RESIGEST360 - Bloque 4: Trazabilidad, Pesadas, Incidencias y Cierre (RD 553/2020)
-- ========================================================================

-- 1. Ampliar identification_documents con campos de ciclo de vida del traslado
ALTER TABLE public.identification_documents
ADD COLUMN IF NOT EXISTS estado_traslado VARCHAR(30) DEFAULT 'borrador',
ADD COLUMN IF NOT EXISTS peso_origen_kg NUMERIC(12, 3),
ADD COLUMN IF NOT EXISTS peso_destino_kg NUMERIC(12, 3),
ADD COLUMN IF NOT EXISTS diferencia_peso_kg NUMERIC(12, 3),
ADD COLUMN IF NOT EXISTS porcentaje_discrepancia NUMERIC(6, 2),
ADD COLUMN IF NOT EXISTS numero_albaran_gestor VARCHAR(100),
ADD COLUMN IF NOT EXISTS ticket_pesada_url TEXT,
ADD COLUMN IF NOT EXISTS fecha_salida TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fecha_llegada_destino TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS fecha_tratamiento TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS resultado_recepcion VARCHAR(30), -- 'aceptado', 'rechazado_parcial', 'rechazado_total'
ADD COLUMN IF NOT EXISTS tipo_incidencia VARCHAR(100), -- 'discrepancia_peso', 'residuo_no_conforme', 'etiquetado_incorrecto', 'envase_deteriorado', 'otro'
ADD COLUMN IF NOT EXISTS motivo_incidencia TEXT,
ADD COLUMN IF NOT EXISTS cantidad_rechazada_kg NUMERIC(12, 3),

-- Datos nominativos y firmas de los intervinientes
ADD COLUMN IF NOT EXISTS firma_transportista_url TEXT,
ADD COLUMN IF NOT EXISTS fecha_firma_transportista TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS nombre_transportista VARCHAR(150),
ADD COLUMN IF NOT EXISTS dni_transportista VARCHAR(50),

ADD COLUMN IF NOT EXISTS firma_gestor_url TEXT,
ADD COLUMN IF NOT EXISTS fecha_firma_gestor TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS nombre_gestor VARCHAR(150),
ADD COLUMN IF NOT EXISTS dni_gestor VARCHAR(50),

ADD COLUMN IF NOT EXISTS firma_productor_url TEXT,
ADD COLUMN IF NOT EXISTS fecha_firma_productor TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS nombre_productor VARCHAR(150),
ADD COLUMN IF NOT EXISTS dni_productor VARCHAR(50);

-- 2. Índices para acelerar consultas y filtrado
CREATE INDEX IF NOT EXISTS idx_id_docs_estado_traslado ON public.identification_documents(estado_traslado);
CREATE INDEX IF NOT EXISTS idx_id_docs_resultado_recepcion ON public.identification_documents(resultado_recepcion);
CREATE INDEX IF NOT EXISTS idx_id_docs_fecha_salida ON public.identification_documents(fecha_salida);
CREATE INDEX IF NOT EXISTS idx_id_docs_fecha_llegada ON public.identification_documents(fecha_llegada_destino);

-- 3. Backfill seguro: inicializar peso_origen_kg en base a la cantidad registrada si está vacío
UPDATE public.identification_documents
SET 
    peso_origen_kg = CASE 
        WHEN unidad = 'toneladas' THEN cantidad * 1000 
        WHEN unidad = 'kg' THEN cantidad
        ELSE cantidad
    END,
    estado_traslado = CASE
        WHEN estado = 'completado' THEN 'tratado'
        WHEN estado = 'pendiente-firma' THEN 'en_transito'
        WHEN estado = 'cancelado' THEN 'rechazado_total'
        ELSE 'borrador'
    END
WHERE peso_origen_kg IS NULL;
