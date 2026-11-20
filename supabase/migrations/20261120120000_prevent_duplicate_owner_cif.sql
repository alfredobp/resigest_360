-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN: RESTRINGIR DUPLICIDAD DE CIF EN EMPRESAS TITULARES
-- Garantiza que sólo exista una empresa titular (is_my_company = true) activa por CIF
-- en toda la plataforma, evitando colisiones multi-tenant y mezcla documental.
-- ==============================================================================

BEGIN;

-- Crear índice único condicional para CIFs de empresas titulares activas
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_unique_owner_cif
  ON public.companies (UPPER(TRIM(cif)))
  WHERE is_my_company = true AND activo = true;

COMMIT;
