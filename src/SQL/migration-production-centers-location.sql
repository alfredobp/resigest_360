-- Migration: Add municipio and provincia to production_centers
-- Date: 2026-01-25

ALTER TABLE public.production_centers
ADD COLUMN IF NOT EXISTS municipio VARCHAR(100),
ADD COLUMN IF NOT EXISTS provincia VARCHAR(100),
ADD COLUMN IF NOT EXISTS codigo_postal VARCHAR(20);

COMMENT ON COLUMN public.production_centers.municipio IS 'Municipio donde se ubica el centro de producción';
COMMENT ON COLUMN public.production_centers.provincia IS 'Provincia donde se ubica el centro de producción';
COMMENT ON COLUMN public.production_centers.codigo_postal IS 'Código postal donde se ubica el centro de producción';
