-- =====================================================
-- CARRIERS TABLE (Transportistas)
-- Transportistas internos de cada empresa cliente
-- =====================================================

CREATE TABLE IF NOT EXISTS public.carriers (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Datos básicos
    razon_social VARCHAR(255) NOT NULL,
    cif VARCHAR(20) NOT NULL,
    nima VARCHAR(50),
    numero_autorizacion VARCHAR(100),
    
    -- Vehículo
    matricula VARCHAR(20),
    
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
    
    CONSTRAINT carriers_cif_user_unique UNIQUE (cif, user_id)
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_carriers_user_id ON public.carriers(user_id);
CREATE INDEX IF NOT EXISTS idx_carriers_cif ON public.carriers(cif);

-- RLS
ALTER TABLE public.carriers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own carriers" ON public.carriers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own carriers" ON public.carriers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own carriers" ON public.carriers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own carriers" ON public.carriers
    FOR DELETE USING (auth.uid() = user_id);

-- Trigger para updated_at
CREATE TRIGGER update_carriers_updated_at BEFORE UPDATE ON public.carriers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Vincular con documentos de identificación (opcional, pero ayuda)
-- Aunque el DI ya tiene los campos planos, a veces es bueno tener la FK.
-- Pero para mantener la consistencia con TreatmentManager, añadiré el campo al DI? 
-- No, el DI suele ser una foto fija. Lo dejaré en los servicios.
