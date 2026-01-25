-- Migration: Add nombre (friendly name) to treatment_managers
-- Date: 2026-01-25

ALTER TABLE public.treatment_managers
ADD COLUMN IF NOT EXISTS nombre VARCHAR(255);

-- Update existing records to have razon_social as default nombre if null
UPDATE public.treatment_managers SET nombre = razon_social WHERE nombre IS NULL;

-- Make it NOT NULL for future records
ALTER TABLE public.treatment_managers ALTER COLUMN nombre SET NOT NULL;

COMMENT ON COLUMN public.treatment_managers.nombre IS 'Nombre descriptivo o comercial del gestor (para listados)';
