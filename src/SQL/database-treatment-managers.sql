-- =====================================================
-- TREATMENT MANAGERS TABLE (Gestores de Tratamiento)
-- Gestores internos de cada empresa cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS public.treatment_managers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Datos básicos
    razon_social VARCHAR(255) NOT NULL,
    cif VARCHAR(20) NOT NULL,
    nima VARCHAR(50),
    numero_autorizacion VARCHAR(100),
    
    -- Domicilio
    direccion TEXT,
    codigo_postal VARCHAR(10),
    municipio VARCHAR(100),
    provincia VARCHAR(100),
    
    -- Contacto
    telefono VARCHAR(20),
    email VARCHAR(255),
    persona_contacto VARCHAR(255),
    
    -- Metadata
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT treatment_managers_cif_user_unique UNIQUE (cif, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_treatment_managers_user_id ON public.treatment_managers(user_id);
CREATE INDEX IF NOT EXISTS idx_treatment_managers_cif ON public.treatment_managers(cif);

-- RLS
ALTER TABLE public.treatment_managers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own treatment managers" ON public.treatment_managers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own treatment managers" ON public.treatment_managers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own treatment managers" ON public.treatment_managers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own treatment managers" ON public.treatment_managers
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_treatment_managers_updated_at BEFORE UPDATE ON public.treatment_managers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vincular con contratos (permitir nulo para mantener compatibilidad)
ALTER TABLE public.waste_contracts ADD COLUMN IF NOT EXISTS treatment_manager_id BIGINT REFERENCES public.treatment_managers(id) ON DELETE SET NULL;
