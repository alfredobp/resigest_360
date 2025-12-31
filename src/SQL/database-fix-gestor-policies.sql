-- =====================================================
-- FIX: Allow viewing shared companies (gestores, transportistas, etc.)
-- =====================================================

-- Drop existing SELECT policy for companies
DROP POLICY IF EXISTS "Users can view own companies" ON public.companies;
DROP POLICY IF EXISTS "Users can view shared companies" ON public.companies;

-- Recreate policies to allow viewing own companies AND shared companies
-- Users can view their own companies
CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT USING (auth.uid() = companies.user_id);

-- Users can view gestor, transportista, negociante, and agente companies (shared resources)
CREATE POLICY "Users can view shared companies" ON public.companies
    FOR SELECT USING (companies.tipo_empresa IN ('gestor', 'transportista', 'negociante', 'agente'));
