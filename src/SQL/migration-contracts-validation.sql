-- ========================================================================
-- MIGRATION: CONTRACTS VALIDATION, FACILITIES & WASTE CODES
-- RESIGEST360 - Bloque 3: Contratos con Validación de Alcance, Instalaciones y Vigencia
-- ========================================================================

-- 1. Ampliar waste_contracts con centros de origen y destino, y autorización
ALTER TABLE public.waste_contracts
ADD COLUMN IF NOT EXISTS producer_center_id BIGINT REFERENCES public.production_centers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS gestor_center_id BIGINT REFERENCES public.production_centers(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS environmental_authorization_id BIGINT REFERENCES public.environmental_authorizations(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS codigos_ler TEXT[] DEFAULT '{}';

-- Índices de búsqueda
CREATE INDEX IF NOT EXISTS idx_waste_contracts_producer_center ON public.waste_contracts(producer_center_id);
CREATE INDEX IF NOT EXISTS idx_waste_contracts_gestor_center ON public.waste_contracts(gestor_center_id);
CREATE INDEX IF NOT EXISTS idx_waste_contracts_env_auth ON public.waste_contracts(environmental_authorization_id);
CREATE INDEX IF NOT EXISTS idx_waste_contracts_codigos_ler ON public.waste_contracts USING GIN (codigos_ler);

-- 2. Tabla relacional de residuos y operaciones del contrato
CREATE TABLE IF NOT EXISTS public.contract_waste_codes (
    id BIGSERIAL PRIMARY KEY,
    contract_id BIGINT NOT NULL REFERENCES public.waste_contracts(id) ON DELETE CASCADE,
    codigo_ler VARCHAR(20) NOT NULL,
    descripcion_ler TEXT,
    operacion_tratamiento VARCHAR(20) NOT NULL, -- Ej: 'R03', 'R13', 'D10'
    tarifa_gestion NUMERIC(10, 2),
    tipo_precio VARCHAR(30) DEFAULT 'por_tonelada',
    cantidad_estimada_anual NUMERIC(12, 2),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para contract_waste_codes
CREATE INDEX IF NOT EXISTS idx_cwc_contract_id ON public.contract_waste_codes(contract_id);
CREATE INDEX IF NOT EXISTS idx_cwc_codigo_ler ON public.contract_waste_codes(codigo_ler);

-- RLS para contract_waste_codes
ALTER TABLE public.contract_waste_codes ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies WHERE tablename = 'contract_waste_codes' AND policyname = 'Users can manage own contract waste codes'
    ) THEN
        CREATE POLICY "Users can manage own contract waste codes" ON public.contract_waste_codes
            FOR ALL USING (
                EXISTS (
                    SELECT 1 FROM public.waste_contracts wc
                    WHERE wc.id = contract_waste_codes.contract_id
                    AND wc.user_id = auth.uid()
                )
            );
    END IF;
END $$;
