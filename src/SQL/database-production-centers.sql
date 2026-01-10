-- =====================================================
-- PRODUCTION CENTERS TABLE (Centros de Producción)
-- Un centro de producción pertenece a una empresa (1:N)
-- =====================================================

CREATE TABLE IF NOT EXISTS public.production_centers (
    id BIGSERIAL PRIMARY KEY,
    company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Datos del centro
    nombre VARCHAR(255) NOT NULL,
    direccion TEXT NOT NULL,
    nima VARCHAR(50) NOT NULL,
    descripcion TEXT,
    
    -- Metadata
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =====================================================
-- ÍNDICES
-- =====================================================
CREATE INDEX IF NOT EXISTS idx_production_centers_company_id ON public.production_centers(company_id);
CREATE INDEX IF NOT EXISTS idx_production_centers_user_id ON public.production_centers(user_id);
CREATE INDEX IF NOT EXISTS idx_production_centers_nima ON public.production_centers(nima);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================
ALTER TABLE public.production_centers ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios centros de producción
CREATE POLICY "Users can view own production centers" ON public.production_centers
    FOR SELECT USING (auth.uid() = user_id);

-- Los usuarios pueden insertar sus propios centros de producción
CREATE POLICY "Users can insert own production centers" ON public.production_centers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios centros de producción
CREATE POLICY "Users can update own production centers" ON public.production_centers
    FOR UPDATE USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios centros de producción
CREATE POLICY "Users can delete own production centers" ON public.production_centers
    FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGERS PARA UPDATED_AT
-- =====================================================
-- Nota: La función update_updated_at_column() ya debe existir 
-- (generalmente creada en database-waste-management.sql)

DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_proc WHERE proname = 'update_updated_at_column') THEN
        CREATE TRIGGER update_production_centers_updated_at 
        BEFORE UPDATE ON public.production_centers
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;

COMMENT ON TABLE public.production_centers IS 'Centros de producción asociados a las empresas';
