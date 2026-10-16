-- ========================================================================
-- MIGRATION: ENVIRONMENTAL AUTHORIZATIONS & DESTINATION SCOPE MATRIX
-- RESIGEST360 - Bloque 2: Autorizaciones Ambientales y Matriz de Destinos
-- ========================================================================

-- 1. Tabla de Autorizaciones Ambientales de Gestores e Instalaciones
CREATE TABLE IF NOT EXISTS public.environmental_authorizations (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    production_center_id BIGINT REFERENCES public.production_centers(id) ON DELETE SET NULL,
    
    numero_autorizacion VARCHAR(100) NOT NULL,
    titulo VARCHAR(255) NOT NULL,
    organismo_emisor VARCHAR(255),
    
    -- Fechas de vigencia
    fecha_emision DATE,
    fecha_vencimiento DATE,
    es_indefinida BOOLEAN NOT NULL DEFAULT false,
    
    -- Documentación acreditativa
    archivo_url TEXT,
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_env_auth_user_id ON public.environmental_authorizations(user_id);
CREATE INDEX IF NOT EXISTS idx_env_auth_company_id ON public.environmental_authorizations(company_id);
CREATE INDEX IF NOT EXISTS idx_env_auth_center_id ON public.environmental_authorizations(production_center_id);
CREATE INDEX IF NOT EXISTS idx_env_auth_numero ON public.environmental_authorizations(numero_autorizacion);

-- RLS para environmental_authorizations
ALTER TABLE public.environmental_authorizations ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'environmental_authorizations' AND policyname = 'Users can view own authorizations'
    ) THEN
        CREATE POLICY "Users can view own authorizations" ON public.environmental_authorizations
            FOR SELECT USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'environmental_authorizations' AND policyname = 'Users can insert own authorizations'
    ) THEN
        CREATE POLICY "Users can insert own authorizations" ON public.environmental_authorizations
            FOR INSERT WITH CHECK (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'environmental_authorizations' AND policyname = 'Users can update own authorizations'
    ) THEN
        CREATE POLICY "Users can update own authorizations" ON public.environmental_authorizations
            FOR UPDATE USING (auth.uid() = user_id);
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'environmental_authorizations' AND policyname = 'Users can delete own authorizations'
    ) THEN
        CREATE POLICY "Users can delete own authorizations" ON public.environmental_authorizations
            FOR DELETE USING (auth.uid() = user_id);
    END IF;
END $$;


-- 2. Tabla de Alcance de la Autorización (Matriz Códigos LER y Operaciones R/D)
CREATE TABLE IF NOT EXISTS public.authorization_waste_codes (
    id BIGSERIAL PRIMARY KEY,
    authorization_id BIGINT NOT NULL REFERENCES public.environmental_authorizations(id) ON DELETE CASCADE,
    codigo_ler VARCHAR(20) NOT NULL,
    descripcion_ler TEXT,
    operaciones_tratamiento TEXT[] NOT NULL DEFAULT '{}', -- Ej: ARRAY['R01', 'R13'] o ARRAY['D10']
    capacidad_anual_toneladas NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para matriz de residuos
CREATE INDEX IF NOT EXISTS idx_auth_waste_auth_id ON public.authorization_waste_codes(authorization_id);
CREATE INDEX IF NOT EXISTS idx_auth_waste_codigo_ler ON public.authorization_waste_codes(codigo_ler);
CREATE INDEX IF NOT EXISTS idx_auth_waste_operaciones ON public.authorization_waste_codes USING GIN (operaciones_tratamiento);

-- RLS para authorization_waste_codes a través de la autorización padre
ALTER TABLE public.authorization_waste_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'authorization_waste_codes' AND policyname = 'Users can manage own authorization waste codes'
    ) THEN
        CREATE POLICY "Users can manage own authorization waste codes" ON public.authorization_waste_codes
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.environmental_authorizations ea
                    WHERE ea.id = authorization_waste_codes.authorization_id
                    AND ea.user_id = auth.uid()
                )
            );
    END IF;
END $$;

-- Trigger para updated_at en environmental_authorizations
DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_trigger WHERE tgname = 'update_env_auth_updated_at'
    ) THEN
        CREATE TRIGGER update_env_auth_updated_at 
        BEFORE UPDATE ON public.environmental_authorizations
        FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    END IF;
END $$;
