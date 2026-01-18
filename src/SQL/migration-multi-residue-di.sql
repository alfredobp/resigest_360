-- =====================================================
-- MIGRACIÓN: SOPORTE PARA MÚLTIPLES RESIDUOS EN DI
-- =====================================================

-- 1. Crear tabla de items de residuos para DIs
CREATE TABLE IF NOT EXISTS public.identification_document_items (
    id BIGSERIAL PRIMARY KEY,
    identification_document_id BIGINT NOT NULL REFERENCES public.identification_documents(id) ON DELETE CASCADE,
    
    -- Datos del residuo (copiamos la estructura del DI original)
    waste_type_id BIGINT REFERENCES public.waste_types(id) ON DELETE SET NULL,
    codigo_ler VARCHAR(20) NOT NULL,
    descripcion_residuo TEXT NOT NULL,
    
    estado_fisico VARCHAR(20) NOT NULL DEFAULT 'solido',
    peligrosidad VARCHAR(20) NOT NULL DEFAULT 'no-peligroso',
    
    cantidad DECIMAL(15,3) NOT NULL,
    unidad VARCHAR(20) NOT NULL DEFAULT 'kg',
    
    operacion_tratamiento VARCHAR(10),
    numero_envases INTEGER,
    tipo_envases VARCHAR(100),
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices
CREATE INDEX IF NOT EXISTS idx_di_items_document_id ON public.identification_document_items(identification_document_id);
CREATE INDEX IF NOT EXISTS idx_di_items_codigo_ler ON public.identification_document_items(codigo_ler);

-- 3. Habilitar RLS
ALTER TABLE public.identification_document_items ENABLE ROW LEVEL SECURITY;

-- 4. Políticas RLS
CREATE POLICY "Users can view own DI items" ON public.identification_document_items
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.identification_documents
            WHERE identification_documents.id = identification_document_items.identification_document_id
            AND identification_documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can insert own DI items" ON public.identification_document_items
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.identification_documents
            WHERE identification_documents.id = identification_document_items.identification_document_id
            AND identification_documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can update own DI items" ON public.identification_document_items
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.identification_documents
            WHERE identification_documents.id = identification_document_items.identification_document_id
            AND identification_documents.user_id = auth.uid()
        )
    );

CREATE POLICY "Users can delete own DI items" ON public.identification_document_items
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.identification_documents
            WHERE identification_documents.id = identification_document_items.identification_document_id
            AND identification_documents.user_id = auth.uid()
        )
    );

-- 5. Trigger para updated_at
CREATE TRIGGER update_di_items_updated_at BEFORE UPDATE ON public.identification_document_items
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 6. Comentario
COMMENT ON TABLE public.identification_document_items IS 'Desglose de múltiples residuos dentro de un Documento de Identificación';
