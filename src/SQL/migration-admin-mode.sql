-- ========================================================================
-- MIGRATION: MODO ADMINISTRADOR DE PLATAFORMA (SUPERADMIN)
-- RESIGEST 360 - Gestión y Supervisión Global Multi-Inquilino
-- ========================================================================

-- 1. Asegurar que la columna 'role' en public.profiles sea de tipo TEXT
-- Si ya existía como un tipo ENUM (ej: user_role), se convierte automáticamente
-- a TEXT con (USING role::TEXT) para permitir el valor 'admin' sin restricciones rígidas.
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
          AND table_name = 'profiles' 
          AND column_name = 'role'
    ) THEN
        ALTER TABLE public.profiles ALTER COLUMN role TYPE TEXT USING role::TEXT;
    ELSE
        ALTER TABLE public.profiles ADD COLUMN role TEXT DEFAULT 'user';
    END IF;
END $$;

-- Establecer valor por defecto 'user'
ALTER TABLE public.profiles ALTER COLUMN role SET DEFAULT 'user';

-- Crear índice para optimizar consultas de roles
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. Asignar rol 'admin' al superadministrador principal de la plataforma
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'alfredobape@gmail.com';

-- 3. Crear función de seguridad para comprobar si el usuario autenticado es admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM public.profiles 
    WHERE id = auth.uid() 
      AND (role::TEXT = 'admin' OR role::TEXT = 'superadmin' OR email = 'alfredobape@gmail.com')
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

-- 4. Actualizar políticas RLS en public.profiles para que los admins puedan ver todos los perfiles
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'profiles' AND policyname = 'Admins can view all profiles'
    ) THEN
        CREATE POLICY "Admins can view all profiles" 
        ON public.profiles 
        FOR SELECT 
        USING (auth.uid() = id OR public.is_admin());
    END IF;
END $$;

-- 5. Actualizar políticas RLS en public.companies para que los admins puedan ver todas las empresas
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'companies' AND policyname = 'Admins can view all companies'
    ) THEN
        CREATE POLICY "Admins can view all companies" 
        ON public.companies 
        FOR SELECT 
        USING (auth.uid() = user_id OR public.is_admin());
    END IF;
END $$;

-- 6. Actualizar políticas RLS en public.production_centers
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'production_centers' AND policyname = 'Admins can view all production centers'
    ) THEN
        CREATE POLICY "Admins can view all production centers" 
        ON public.production_centers 
        FOR SELECT 
        USING (public.is_admin() OR EXISTS (
            SELECT 1 FROM public.companies 
            WHERE companies.id = production_centers.company_id 
              AND companies.user_id = auth.uid()
        ));
    END IF;
END $$;

-- 7. Actualizar políticas RLS en public.identification_documents
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'identification_documents' AND policyname = 'Admins can view all DIs'
    ) THEN
        CREATE POLICY "Admins can view all DIs" 
        ON public.identification_documents 
        FOR SELECT 
        USING (auth.uid() = user_id OR public.is_admin());
    END IF;
END $$;

-- 8. Actualizar políticas RLS en public.waste_contracts
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'waste_contracts' AND policyname = 'Admins can view all contracts'
    ) THEN
        CREATE POLICY "Admins can view all contracts" 
        ON public.waste_contracts 
        FOR SELECT 
        USING (auth.uid() = user_id OR public.is_admin());
    END IF;
END $$;

-- 9. Actualizar políticas RLS en public.environmental_authorizations (si existe la tabla)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' AND table_name = 'environmental_authorizations'
    ) THEN
        IF NOT EXISTS (
            SELECT 1 FROM pg_policies 
            WHERE tablename = 'environmental_authorizations' AND policyname = 'Admins can view all authorizations'
        ) THEN
            CREATE POLICY "Admins can view all authorizations" 
            ON public.environmental_authorizations 
            FOR SELECT 
            USING (auth.uid() = user_id OR public.is_admin());
        END IF;
    END IF;
END $$;

-- 10. Función RPC optimizada para devolver métricas y KPIs globales de la plataforma
CREATE OR REPLACE FUNCTION public.get_platform_stats()
RETURNS JSON AS $$
DECLARE
    v_total_companies BIGINT := 0;
    v_my_companies BIGINT := 0;
    v_total_users BIGINT := 0;
    v_total_dis BIGINT := 0;
    v_total_contracts BIGINT := 0;
    v_total_centers BIGINT := 0;
    v_total_toneladas NUMERIC := 0;
    v_result JSON;
BEGIN
    -- Verificar privilegios de administrador
    IF NOT public.is_admin() THEN
        RAISE EXCEPTION 'Acceso denegado: Se requieren privilegios de administrador de plataforma';
    END IF;

    -- Conteo de empresas
    SELECT COUNT(*), COUNT(*) FILTER (WHERE is_my_company = true)
    INTO v_total_companies, v_my_companies
    FROM public.companies;

    -- Conteo de perfiles/usuarios
    SELECT COUNT(*) INTO v_total_users FROM public.profiles;

    -- Conteo de DIs y toneladas (soporta cantidad o cantidad_estimada según el esquema)
    BEGIN
        SELECT COUNT(*), COALESCE(SUM(cantidad), 0)
        INTO v_total_dis, v_total_toneladas
        FROM public.identification_documents;
    EXCEPTION WHEN undefined_column THEN
        SELECT COUNT(*), COALESCE(SUM(cantidad_estimada), 0)
        INTO v_total_dis, v_total_toneladas
        FROM public.identification_documents;
    END;

    -- Conteo de contratos
    SELECT COUNT(*) INTO v_total_contracts FROM public.waste_contracts;

    -- Conteo de centros de producción
    SELECT COUNT(*) INTO v_total_centers FROM public.production_centers;

    v_result := json_build_object(
        'totalCompanies', v_total_companies,
        'myCompanies', v_my_companies,
        'totalUsers', v_total_users,
        'totalDIs', v_total_dis,
        'totalContracts', v_total_contracts,
        'totalCenters', v_total_centers,
        'totalToneladas', ROUND(v_total_toneladas, 2)
    );

    RETURN v_result;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;

COMMENT ON FUNCTION public.is_admin() IS 'Verifica si el usuario autenticado tiene rol de administrador en Resigest 360';
COMMENT ON FUNCTION public.get_platform_stats() IS 'Retorna el resumen ejecutivo y métricas globales de la plataforma para administradores';
