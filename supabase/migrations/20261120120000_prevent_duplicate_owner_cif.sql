-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN: RESTRINGIR DUPLICIDAD DE CIF EN EMPRESAS TITULARES
-- 1. Sanea duplicados históricos existentes:
--    - Identifica la empresa titular principal (la más antigua por created_at).
--    - Opcionalmente añade a los usuarios duplicados a la empresa principal en company_memberships.
--    - Desmarca los duplicados posteriores (is_my_company = false).
-- 2. Crea el índice único condicional para evitar nuevos duplicados en el futuro.
-- ==============================================================================

BEGIN;

-- 1. Vincular los usuarios secundarios como miembros de la empresa titular principal
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' AND table_name = 'company_memberships'
  ) THEN
    WITH ranked AS (
      SELECT id,
             user_id,
             FIRST_VALUE(id) OVER (
               PARTITION BY UPPER(TRIM(cif))
               ORDER BY created_at ASC, id ASC
             ) AS primary_company_id,
             ROW_NUMBER() OVER (
               PARTITION BY UPPER(TRIM(cif))
               ORDER BY created_at ASC, id ASC
             ) AS rn
      FROM public.companies
      WHERE is_my_company = true AND activo = true
    )
    INSERT INTO public.company_memberships (company_id, user_id, role, can_view_commercial)
    SELECT primary_company_id, user_id, 'consultor_admin', true
    FROM ranked
    WHERE rn > 1 AND user_id IS NOT NULL
    ON CONFLICT (company_id, user_id) DO NOTHING;
  END IF;
END $$;

-- 2. Desmarcar titularidad en empresas duplicadas más recientes
WITH duplicates AS (
  SELECT id,
         ROW_NUMBER() OVER (
           PARTITION BY UPPER(TRIM(cif))
           ORDER BY created_at ASC, id ASC
         ) AS rn
  FROM public.companies
  WHERE is_my_company = true AND activo = true
)
UPDATE public.companies
SET is_my_company = false
WHERE id IN (
  SELECT id FROM duplicates WHERE rn > 1
);

-- 3. Crear índice único condicional para CIFs de empresas titulares activas
CREATE UNIQUE INDEX IF NOT EXISTS idx_companies_unique_owner_cif
  ON public.companies (UPPER(TRIM(cif)))
  WHERE is_my_company = true AND activo = true;

COMMIT;
