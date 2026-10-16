-- ========================================================================
-- MIGRATION: UNIFIED COMPANIES & MULTI-ROLE ARCHITECTURE
-- RESIGEST360 - Bloque 1: Maestro Único de Empresas con Múltiples Roles
-- ========================================================================

-- 1. Ampliar tabla public.companies con soporte para roles múltiples y datos operativos
ALTER TABLE public.companies 
ADD COLUMN IF NOT EXISTS roles TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS is_my_company BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS numero_autorizacion VARCHAR(100),
ADD COLUMN IF NOT EXISTS matricula VARCHAR(50);

-- Crear índice GIN para búsquedas eficientes por roles (ej: roles @> ARRAY['gestor'])
CREATE INDEX IF NOT EXISTS idx_companies_roles ON public.companies USING GIN (roles);
CREATE INDEX IF NOT EXISTS idx_companies_is_my_company ON public.companies(is_my_company);

-- 2. Migrar tipo_empresa actual al array de roles para las empresas existentes
UPDATE public.companies 
SET roles = ARRAY[tipo_empresa::TEXT] 
WHERE (roles IS NULL OR roles = '{}') AND tipo_empresa IS NOT NULL;

-- 3. Marcar la empresa propia principal (la creada por cada usuario en su perfil)
-- Las empresas con credenciales SIRA/Holded o creadas como empresa titular se marcan como is_my_company
UPDATE public.companies
SET is_my_company = true
WHERE id IN (
    SELECT DISTINCT company_id FROM public.production_centers
) OR sira_usuario IS NOT NULL OR holded_api_key IS NOT NULL;

-- 4. Migración idempotente de GESTORES desde public.treatment_managers
DO $$
DECLARE
    r RECORD;
    existing_id BIGINT;
BEGIN
    FOR r IN SELECT * FROM public.treatment_managers LOOP
        -- Comprobar si ya existe una empresa con ese CIF para el mismo usuario
        SELECT id INTO existing_id 
        FROM public.companies 
        WHERE cif = r.cif AND user_id = r.user_id 
        LIMIT 1;

        IF existing_id IS NOT NULL THEN
            -- Si ya existe, añadir el rol 'gestor' si no lo tiene y actualizar datos si faltan
            UPDATE public.companies 
            SET 
                roles = array_append(
                    array_remove(roles, 'gestor'), 
                    'gestor'
                ),
                numero_autorizacion = COALESCE(numero_autorizacion, r.numero_autorizacion),
                nima = COALESCE(nima, r.nima),
                domicilio_social = COALESCE(domicilio_social, r.direccion),
                codigo_postal_social = COALESCE(codigo_postal_social, r.codigo_postal),
                municipio_social = COALESCE(municipio_social, r.municipio),
                provincia_social = COALESCE(provincia_social, r.provincia),
                telefono = COALESCE(telefono, r.telefono),
                email = COALESCE(email, r.email),
                persona_contacto = COALESCE(persona_contacto, r.persona_contacto)
            WHERE id = existing_id;
        ELSE
            -- Si no existe, insertar nueva empresa con rol 'gestor'
            INSERT INTO public.companies (
                user_id,
                razon_social,
                cif,
                nima,
                numero_autorizacion,
                domicilio_social,
                codigo_postal_social,
                municipio_social,
                provincia_social,
                telefono,
                email,
                persona_contacto,
                tipo_empresa,
                roles,
                is_my_company,
                notas,
                activo,
                created_at,
                updated_at
            ) VALUES (
                r.user_id,
                r.razon_social,
                r.cif,
                r.nima,
                r.numero_autorizacion,
                r.direccion,
                r.codigo_postal,
                r.municipio,
                r.provincia,
                r.telefono,
                r.email,
                r.persona_contacto,
                'gestor',
                ARRAY['gestor'],
                false,
                r.notas,
                r.activo,
                r.created_at,
                r.updated_at
            );
        END IF;
    END LOOP;
END $$;

-- 5. Migración idempotente de TRANSPORTISTAS desde public.carriers
DO $$
DECLARE
    r RECORD;
    existing_id BIGINT;
BEGIN
    FOR r IN SELECT * FROM public.carriers LOOP
        SELECT id INTO existing_id 
        FROM public.companies 
        WHERE cif = r.cif AND user_id = r.user_id 
        LIMIT 1;

        IF existing_id IS NOT NULL THEN
            UPDATE public.companies 
            SET 
                roles = array_append(
                    array_remove(roles, 'transportista'), 
                    'transportista'
                ),
                matricula = COALESCE(matricula, r.matricula),
                numero_autorizacion = COALESCE(numero_autorizacion, r.numero_autorizacion),
                nima = COALESCE(nima, r.nima),
                domicilio_social = COALESCE(domicilio_social, r.direccion),
                codigo_postal_social = COALESCE(codigo_postal_social, r.codigo_postal),
                municipio_social = COALESCE(municipio_social, r.municipio),
                provincia_social = COALESCE(provincia_social, r.provincia),
                telefono = COALESCE(telefono, r.telefono),
                email = COALESCE(email, r.email),
                persona_contacto = COALESCE(persona_contacto, r.persona_contacto)
            WHERE id = existing_id;
        ELSE
            INSERT INTO public.companies (
                user_id,
                razon_social,
                cif,
                nima,
                numero_autorizacion,
                matricula,
                domicilio_social,
                codigo_postal_social,
                municipio_social,
                provincia_social,
                telefono,
                email,
                persona_contacto,
                tipo_empresa,
                roles,
                is_my_company,
                notas,
                activo,
                created_at,
                updated_at
            ) VALUES (
                r.user_id,
                r.razon_social,
                r.cif,
                r.nima,
                r.numero_autorizacion,
                r.matricula,
                r.direccion,
                r.codigo_postal,
                r.municipio,
                r.provincia,
                r.telefono,
                r.email,
                r.persona_contacto,
                'transportista',
                ARRAY['transportista'],
                false,
                r.notas,
                r.activo,
                r.created_at,
                r.updated_at
            );
        END IF;
    END LOOP;
END $$;

-- 6. Ampliar instalaciones / centros de producción para soportar tipos de instalación
ALTER TABLE public.production_centers
ADD COLUMN IF NOT EXISTS tipo_instalacion VARCHAR(50) DEFAULT 'produccion';

COMMENT ON COLUMN public.companies.roles IS 'Lista de roles activos que desempeña la empresa: productor, gestor, transportista, negociante, agente, cliente, proveedor';
COMMENT ON COLUMN public.companies.is_my_company IS 'Indica si es la empresa titular propia del usuario autenticado';
COMMENT ON COLUMN public.production_centers.tipo_instalacion IS 'Tipo de instalación: produccion, tratamiento, almacen, sede_logistica';
