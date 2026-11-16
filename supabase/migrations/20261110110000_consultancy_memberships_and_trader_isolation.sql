-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN: MEMBRESÍAS DE CONSULTORÍA Y AISLAMIENTO NEGOCIANTE
-- Bloque 2: Acceso multi-empresa para Método Ambiental y aislamiento estricto
-- de operaciones comerciales (Negociante)
-- ==============================================================================

BEGIN;

-- 1. Tabla de membresías multi-empresa (consultoría / equipos autorizados)
CREATE TABLE IF NOT EXISTS public.company_memberships (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'consultor_operador' CHECK (
    role IN ('owner', 'consultor_admin', 'consultor_operador', 'lectura')
  ),
  can_view_commercial BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  CONSTRAINT company_memberships_company_user_unique UNIQUE (company_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_company_memberships_user_id ON public.company_memberships(user_id);
CREATE INDEX IF NOT EXISTS idx_company_memberships_company_id ON public.company_memberships(company_id);

ALTER TABLE public.company_memberships ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own memberships" ON public.company_memberships;
CREATE POLICY "Users can view own memberships" ON public.company_memberships
  FOR SELECT USING (auth.uid() = user_id OR public.is_admin());

DROP POLICY IF EXISTS "Company owners can manage memberships" ON public.company_memberships;
CREATE POLICY "Company owners can manage memberships" ON public.company_memberships
  FOR ALL USING (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_memberships.company_id
        AND c.user_id = auth.uid()
    )
  )
  WITH CHECK (
    public.is_admin()
    OR EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.id = company_memberships.company_id
        AND c.user_id = auth.uid()
    )
  );

-- 2. Funciones helper de autorización multi-empresa y módulo comercial
CREATE OR REPLACE FUNCTION public.has_company_access(p_company_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_company_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_memberships m
          WHERE m.company_id = c.id
            AND m.user_id = auth.uid()
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.has_company_write_access(p_company_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_company_id IS NULL THEN
    RETURN FALSE;
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_memberships m
          WHERE m.company_id = c.id
            AND m.user_id = auth.uid()
            AND m.role IN ('owner', 'consultor_admin', 'consultor_operador')
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

CREATE OR REPLACE FUNCTION public.can_access_commercial_op(p_user_id UUID, p_company_id BIGINT)
RETURNS BOOLEAN AS $$
BEGIN
  -- El propietario directo mantiene acceso si su empresa tiene perfil negociante/chatarreria/completo
  IF p_company_id IS NULL THEN
    RETURN auth.uid() = p_user_id AND EXISTS (
      SELECT 1 FROM public.companies c
      WHERE c.user_id = auth.uid()
        AND c.is_my_company = true
        AND 'operaciones_comerciales' = ANY(COALESCE(c.modulos_activos, '{}'))
    );
  END IF;

  RETURN EXISTS (
    SELECT 1 FROM public.companies c
    WHERE c.id = p_company_id
      AND 'operaciones_comerciales' = ANY(COALESCE(c.modulos_activos, '{}'))
      AND (
        c.user_id = auth.uid()
        OR EXISTS (
          SELECT 1 FROM public.company_memberships m
          WHERE m.company_id = c.id
            AND m.user_id = auth.uid()
            AND m.can_view_commercial = true
        )
      )
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 3. Actualizar políticas RLS de entidades operativas para soportar membresías de consultoría
-- 3.1 Companies
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
CREATE POLICY "Users can view own companies" ON public.companies
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can update own companies" ON public.companies;
CREATE POLICY "Users can update own companies" ON public.companies
  FOR UPDATE USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM public.company_memberships m
      WHERE m.company_id = companies.id
        AND m.user_id = auth.uid()
        AND m.role IN ('owner', 'consultor_admin')
    )
  );

-- 3.2 Production Centers
DROP POLICY IF EXISTS "Users can view own production centers" ON public.production_centers;
CREATE POLICY "Users can view own production centers" ON public.production_centers
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(company_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own production centers" ON public.production_centers;
CREATE POLICY "Users can insert own production centers" ON public.production_centers
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

DROP POLICY IF EXISTS "Users can update own production centers" ON public.production_centers;
CREATE POLICY "Users can update own production centers" ON public.production_centers
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

-- 3.3 Waste Contracts
DROP POLICY IF EXISTS "Users can view own contracts" ON public.waste_contracts;
CREATE POLICY "Users can view own contracts" ON public.waste_contracts
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(company_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own contracts" ON public.waste_contracts;
CREATE POLICY "Users can insert own contracts" ON public.waste_contracts
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

DROP POLICY IF EXISTS "Users can update own contracts" ON public.waste_contracts;
CREATE POLICY "Users can update own contracts" ON public.waste_contracts
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

-- 3.4 Identification Documents
DROP POLICY IF EXISTS "Users can view own identification documents" ON public.identification_documents;
CREATE POLICY "Users can view own identification documents" ON public.identification_documents
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(company_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own identification documents" ON public.identification_documents;
CREATE POLICY "Users can insert own identification documents" ON public.identification_documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

DROP POLICY IF EXISTS "Users can update own identification documents" ON public.identification_documents;
CREATE POLICY "Users can update own identification documents" ON public.identification_documents
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

-- 3.5 Chronological Registry
DROP POLICY IF EXISTS "Users can view own chronological entries" ON public.chronological_registry;
CREATE POLICY "Users can view own chronological entries" ON public.chronological_registry
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(company_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Users can insert own chronological entries" ON public.chronological_registry;
CREATE POLICY "Users can insert own chronological entries" ON public.chronological_registry
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

-- 3.6 DeCA Documents (mantiene lectura pública por token si existe la política específica)
DROP POLICY IF EXISTS "Users can view own DeCA documents" ON public.deca_documents;
CREATE POLICY "Users can view own DeCA documents" ON public.deca_documents
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(company_id)
    OR public.is_admin()
  );

DROP POLICY IF EXISTS "Los usuarios pueden insertar DeCA en su cuenta" ON public.deca_documents;
CREATE POLICY "Los usuarios pueden insertar DeCA en su cuenta" ON public.deca_documents
  FOR INSERT WITH CHECK (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

DROP POLICY IF EXISTS "Los usuarios pueden actualizar DeCA de su cuenta" ON public.deca_documents;
CREATE POLICY "Los usuarios pueden actualizar DeCA de su cuenta" ON public.deca_documents
  FOR UPDATE USING (
    auth.uid() = user_id
    OR public.has_company_write_access(company_id)
  );

-- 3.7 Annual Reports (Memorias Anuales)
DROP POLICY IF EXISTS "Users can view own memorias" ON public.annual_reports;
CREATE POLICY "Users can view own memorias" ON public.annual_reports
  FOR SELECT USING (
    auth.uid() = user_id
    OR public.has_company_access(company_id)
    OR public.is_admin()
  );

-- 4. Aislamiento ESTRICTO de Commercial Operations (solo Negociante / permiso comercial explícito)
DROP POLICY IF EXISTS "Users can view own commercial operations" ON public.commercial_operations;
CREATE POLICY "Users can view own commercial operations" ON public.commercial_operations
  FOR SELECT USING (public.can_access_commercial_op(user_id, company_id));

DROP POLICY IF EXISTS "Users can create own commercial operations" ON public.commercial_operations;
CREATE POLICY "Users can create own commercial operations" ON public.commercial_operations
  FOR INSERT WITH CHECK (public.can_access_commercial_op(user_id, company_id));

DROP POLICY IF EXISTS "Users can update own commercial operations" ON public.commercial_operations;
CREATE POLICY "Users can update own commercial operations" ON public.commercial_operations
  FOR UPDATE USING (public.can_access_commercial_op(user_id, company_id));

DROP POLICY IF EXISTS "Users can delete own commercial operations" ON public.commercial_operations;
CREATE POLICY "Users can delete own commercial operations" ON public.commercial_operations
  FOR DELETE USING (public.can_access_commercial_op(user_id, company_id));

COMMIT;

