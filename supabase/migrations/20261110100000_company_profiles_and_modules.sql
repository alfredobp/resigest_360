-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN: PERFILES OPERATIVOS Y MÓDULOS POR EMPRESA
-- Bloque 1: Persistencia real de perfil operativo, módulos activos y onboarding
-- ==============================================================================

BEGIN;

-- 1. Columnas de perfil operativo, módulos activos y control de onboarding en public.companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS perfil_operativo TEXT DEFAULT 'productor',
  ADD COLUMN IF NOT EXISTS modulos_activos TEXT[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS onboarding_completado BOOLEAN NOT NULL DEFAULT false;

-- Normalizar constraint de perfil_operativo de forma idempotente
ALTER TABLE public.companies
  DROP CONSTRAINT IF EXISTS companies_perfil_operativo_check;

ALTER TABLE public.companies
  ADD CONSTRAINT companies_perfil_operativo_check CHECK (
    perfil_operativo IN (
      'productor',
      'chatarreria',
      'gestor_rp',
      'baterias',
      'transportista',
      'negociante',
      'completo'
    )
  );

CREATE INDEX IF NOT EXISTS idx_companies_perfil_operativo
  ON public.companies(perfil_operativo);

CREATE INDEX IF NOT EXISTS idx_companies_modulos_activos
  ON public.companies USING GIN (modulos_activos);

-- 2. Backfill inteligente para empresas ya existentes sin perfil_operativo/modulos_activos
UPDATE public.companies
SET
  perfil_operativo = CASE
    WHEN 'negociante' = ANY(COALESCE(roles, '{}')) AND 'gestor' = ANY(COALESCE(roles, '{}')) AND 'productor' = ANY(COALESCE(roles, '{}')) THEN 'completo'
    WHEN 'negociante' = ANY(COALESCE(roles, '{}')) OR tipo_empresa = 'negociante' THEN 'negociante'
    WHEN 'gestor' = ANY(COALESCE(roles, '{}')) OR tipo_empresa = 'gestor' THEN 'gestor_rp'
    WHEN 'transportista' = ANY(COALESCE(roles, '{}')) OR tipo_empresa = 'transportista' THEN 'transportista'
    ELSE 'productor'
  END
WHERE perfil_operativo IS NULL
   OR (perfil_operativo = 'productor' AND tipo_empresa IS NOT NULL AND tipo_empresa <> 'productor');

UPDATE public.companies
SET
  modulos_activos = CASE perfil_operativo
    WHEN 'transportista' THEN ARRAY['di', 'deca', 'flota_transporte']
    WHEN 'chatarreria' THEN ARRAY['empresas', 'di', 'deca', 'archivo_cronologico', 'operaciones_comerciales', 'memorias_anuales']
    WHEN 'baterias' THEN ARRAY['empresas', 'contratos', 'di', 'deca', 'archivo_cronologico', 'memorias_anuales']
    WHEN 'gestor_rp' THEN ARRAY['empresas', 'contratos', 'gestores', 'di', 'deca', 'archivo_cronologico', 'memorias_anuales', 'sira_integraciones']
    WHEN 'negociante' THEN ARRAY['empresas', 'contratos', 'gestores', 'flota_transporte', 'di', 'deca', 'operaciones_comerciales', 'memorias_anuales']
    WHEN 'completo' THEN ARRAY['empresas', 'contratos', 'gestores', 'flota_transporte', 'di', 'deca', 'archivo_cronologico', 'operaciones_comerciales', 'memorias_anuales', 'sira_integraciones']
    ELSE ARRAY['empresas', 'contratos', 'di', 'deca', 'archivo_cronologico']
  END
WHERE modulos_activos IS NULL OR cardinality(modulos_activos) = 0;

-- Las empresas ya existentes marcadas como propias se consideran ya dadas de alta
UPDATE public.companies
SET onboarding_completado = true
WHERE is_my_company = true
  AND onboarding_completado = false;

-- 3. Endurecer aislamiento RLS de companies (eliminar lectura compartida abierta entre tenants)
DROP POLICY IF EXISTS "Users can view shared companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;

CREATE POLICY "Users can view own companies" ON public.companies
  FOR SELECT USING (
    auth.uid() = user_id
    OR (
      EXISTS (
        SELECT 1 FROM pg_proc p
        JOIN pg_namespace n ON n.oid = p.pronamespace
        WHERE n.nspname = 'public' AND p.proname = 'is_admin'
      )
      AND public.is_admin()
    )
  );

COMMIT;

