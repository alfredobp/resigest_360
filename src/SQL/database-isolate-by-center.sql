-- =====================================================
-- ISOLATE DATA BY PRODUCTION CENTER
-- Modifica DI y Memorias para que dependan de un centro de producción
-- =====================================================

-- 1. Modificar IDENTIFICATION DOCUMENTS
ALTER TABLE public.identification_documents 
ADD COLUMN production_center_id BIGINT REFERENCES public.production_centers(id) ON DELETE SET NULL;

-- Índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_identification_documents_production_center_id 
ON public.identification_documents(production_center_id);

-- 2. Modificar MEMORIAS ANUALES
ALTER TABLE public.memorias_anuales 
ADD COLUMN production_center_id BIGINT REFERENCES public.production_centers(id) ON DELETE CASCADE;

-- Eliminar restricción única antigua y crear la nueva que incluya el centro
-- La restricción antigua suele llamarse memorias_anuales_company_id_año_tipo_memoria_key o similar
-- Intentamos dropear por el nombre que tuviera en el esquema original
ALTER TABLE public.memorias_anuales DROP CONSTRAINT IF EXISTS annual_reports_unique_year;
ALTER TABLE public.memorias_anuales DROP CONSTRAINT IF EXISTS memorias_anuales_unique_year;

ALTER TABLE public.memorias_anuales 
ADD CONSTRAINT memorias_anuales_unique_center_year UNIQUE (company_id, production_center_id, año, tipo_memoria);

-- Índice para mejorar búsquedas
CREATE INDEX IF NOT EXISTS idx_memorias_anuales_production_center_id 
ON public.memorias_anuales(production_center_id);

-- Comentarios
COMMENT ON COLUMN public.identification_documents.production_center_id IS 'Centro de producción desde donde se origina el residuo';
COMMENT ON COLUMN public.memorias_anuales.production_center_id IS 'Centro de producción al que corresponde la memoria anual';
