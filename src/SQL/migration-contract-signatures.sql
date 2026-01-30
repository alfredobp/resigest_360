-- Migración para añadir soporte de firma digital a los contratos de residuos
ALTER TABLE public.waste_contracts 
ADD COLUMN IF NOT EXISTS firma_productor_url TEXT,
ADD COLUMN IF NOT EXISTS fecha_firma_productor TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS firma_gestor_url TEXT,
ADD COLUMN IF NOT EXISTS fecha_firma_gestor TIMESTAMPTZ;

-- Comentarios para las nuevas columnas
COMMENT ON COLUMN public.waste_contracts.firma_productor_url IS 'URL de la imagen de la firma del productor';
COMMENT ON COLUMN public.waste_contracts.fecha_firma_productor IS 'Fecha y hora en la que el productor firmó el contrato';
COMMENT ON COLUMN public.waste_contracts.firma_gestor_url IS 'URL de la imagen de la firma del gestor';
COMMENT ON COLUMN public.waste_contracts.fecha_firma_gestor IS 'Fecha y hora en la que el gestor firmó el contrato';
