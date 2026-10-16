-- ==============================================================================
-- CORRECCIÓN CRÍTICA DE RLS Y MULTI-TENANCY: CONTRATOS DE TRATAMIENTO
-- Corrige la fuga de datos donde usuarios veían contratos de otras entidades
-- ==============================================================================

-- 1. ELIMINAR LA POLÍTICA PERMISIVA QUE CAUSABA LA FUGA DE DATOS
-- La política 'Public can view contract by token' con 'signing_token IS NOT NULL'
-- permitía que cualquier usuario autenticado o anónimo leyera todos los contratos
-- porque signing_token se genera por defecto en todas las filas.
DROP POLICY IF EXISTS "Public can view contract by token" ON public.waste_contracts;
DROP POLICY IF EXISTS "Public can sign contract by token" ON public.waste_contracts;

-- 2. ASEGURAR QUE RLS ESTÁ HABILITADO
ALTER TABLE public.waste_contracts ENABLE ROW LEVEL SECURITY;

-- 3. POLÍTICA ESTRICTA DE LECTURA (SELECT)
-- Un usuario solo puede ver contratos que:
-- a) Haya creado él mismo (user_id = auth.uid())
-- b) O pertenezcan a alguna de sus empresas (como productor o como gestor)
DROP POLICY IF EXISTS "Users can view own contracts" ON public.waste_contracts;
CREATE POLICY "Users can view own contracts" ON public.waste_contracts
    FOR SELECT USING (
        auth.uid() = user_id
        OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR gestor_company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    );

-- 4. POLÍTICA ESTRICTA DE INSERCIÓN (INSERT)
DROP POLICY IF EXISTS "Users can insert own contracts" ON public.waste_contracts;
CREATE POLICY "Users can insert own contracts" ON public.waste_contracts
    FOR INSERT WITH CHECK (
        auth.uid() = user_id
    );

-- 5. POLÍTICA ESTRICTA DE ACTUALIZACIÓN (UPDATE)
DROP POLICY IF EXISTS "Users can update own contracts" ON public.waste_contracts;
CREATE POLICY "Users can update own contracts" ON public.waste_contracts
    FOR UPDATE USING (
        auth.uid() = user_id
        OR company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
        OR gestor_company_id IN (SELECT id FROM public.companies WHERE user_id = auth.uid())
    );

-- 6. POLÍTICA ESTRICTA DE ELIMINACIÓN (DELETE)
DROP POLICY IF EXISTS "Users can delete own contracts" ON public.waste_contracts;
CREATE POLICY "Users can delete own contracts" ON public.waste_contracts
    FOR DELETE USING (
        auth.uid() = user_id
    );

-- 7. FUNCIÓN RPC SEGURA PARA FIRMA PÚBLICA MEDIANTE TOKEN
-- Permite acceder ÚNICAMENTE al contrato específico cuyo token exacto se proporcione,
-- sin exponer el resto de contratos de la base de datos a consultas no autorizadas.
CREATE OR REPLACE FUNCTION public.get_contract_by_signing_token(p_token UUID)
RETURNS JSONB AS $$
DECLARE
    v_result JSONB;
BEGIN
    SELECT to_jsonb(t) INTO v_result
    FROM (
        SELECT 
            wc.*,
            to_jsonb(p) as company,
            to_jsonb(g) as gestor_company,
            to_jsonb(tm) as treatment_manager
        FROM public.waste_contracts wc
        LEFT JOIN public.companies p ON wc.company_id = p.id
        LEFT JOIN public.companies g ON wc.gestor_company_id = g.id
        LEFT JOIN public.treatment_managers tm ON wc.treatment_manager_id = tm.id
        WHERE wc.signing_token = p_token
        LIMIT 1
    ) t;
    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
