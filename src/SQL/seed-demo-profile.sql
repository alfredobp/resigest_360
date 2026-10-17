-- ==============================================================================
-- RESIGEST 360 - SEED DATA: PERFIL DE DEMOSTRACIÓN INTEGRAL Y COMPLETO
-- ==============================================================================
-- Este script crea o actualiza un perfil de prueba ("demo@resigest.com") poblando
-- TODAS las entidades del sistema con un ecosistema de datos exhaustivo:
--
--  1. Usuario y Perfil (auth.users + public.profiles)
--  2. Empresa Principal con credenciales SIRA/Holded (public.companies)
--  3. Catálogo de Empresas Colaboradoras (Productores, Negociantes, Agentes)
--  4. Centros de Producción (3 instalaciones operativas)
--  5. Transportistas Registrados (public.carriers)
--  6. Gestores de Tratamiento (public.treatment_managers)
--  7. Contratos de Tratamiento según RD 553/2020 (public.waste_contracts)
--  8. Documentos de Identificación - DIs (public.identification_documents - 14 DIs)
--  9. Archivo Cronológico Digital - Art. 64 Ley 7/2022 (26 asientos con códigos HP)
-- 10. Operaciones Comerciales de Negociación y Márgenes (public.commercial_operations)
-- 11. Envíos Telemáticos e Integración con Plataforma SIRA (public.sira_submissions)
-- 12. Pista de Auditoría y Logs de Trazabilidad Inmutable (public.audit_logs)
-- 13. Autorizaciones Ambientales (public.environmental_authorizations)
-- 14. Memorias Anuales de Residuos 2025 y 2026 (public.annual_reports + lines)
-- 15. Proyecto Cartográfico y Geodatos GIS (projects, map_collections, spatial_data)
--
-- INSTRUCCIONES DE EJECUCIÓN:
-- 1. Accede a Supabase SQL Editor:
--    https://supabase.com/dashboard/project/wdjwlzsvgvnrveycebhk/sql/new
-- 2. Copia y ejecuta este script completo.
-- 3. Accede en http://localhost:3000/signin con:
--    Email: demo@resigest.com
--    Password: DemoResigest2026!
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ==============================================================================
-- 0. GARANTIZAR EXISTENCIA DE TABLAS GIS (projects, map_collections, spatial_data)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  show BOOLEAN DEFAULT true,
  photo TEXT DEFAULT '',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

CREATE TABLE IF NOT EXISTS public.map_collections (
  id BIGSERIAL PRIMARY KEY,
  project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  photo TEXT DEFAULT '',
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE public.map_collections ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE;

CREATE TABLE IF NOT EXISTS public.spatial_data (
  id BIGSERIAL PRIMARY KEY,
  collection_id BIGINT NOT NULL REFERENCES public.map_collections(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  geometry_type VARCHAR(20) DEFAULT 'point',
  geometry JSONB,
  latitude DOUBLE PRECISION,
  longitude DOUBLE PRECISION,
  address TEXT,
  photo TEXT,
  image TEXT,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Habilitar RLS si no está habilitado
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.spatial_data ENABLE ROW LEVEL SECURITY;

-- Políticas de seguridad para GIS
DO $gis_policy$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'projects' AND policyname = 'Users can manage their own projects') THEN
        CREATE POLICY "Users can manage their own projects" ON public.projects FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'map_collections' AND policyname = 'Users can manage their own collections') THEN
        CREATE POLICY "Users can manage their own collections" ON public.map_collections FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
    IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'spatial_data' AND policyname = 'Users can manage their own spatial data') THEN
        CREATE POLICY "Users can manage their own spatial data" ON public.spatial_data FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
    END IF;
END $gis_policy$;

DO $$
DECLARE
    v_user_id UUID;
    v_company_id BIGINT;
    
    -- Empresas colaboradoras externas
    v_comp_automocion_id BIGINT;
    v_comp_quimica_id BIGINT;
    v_comp_construc_id BIGINT;
    v_comp_broker_id BIGINT;
    v_comp_agente_id BIGINT;
    
    -- Gestores registrados en companies
    v_comp_gestor_ibericas_id BIGINT;
    v_comp_gestor_jarama_id BIGINT;
    v_comp_gestor_reciclajes_id BIGINT;
    v_comp_gestor_tajo_id BIGINT;
    
    -- Transportistas registrados en companies
    v_comp_trans_logistica_id BIGINT;
    v_comp_trans_adr_id BIGINT;
    v_comp_trans_express_id BIGINT;
    v_comp_trans_norte_id BIGINT;
    
    -- Centros de producción
    v_center_central_id BIGINT;
    v_center_sur_id BIGINT;
    v_center_corredor_id BIGINT;
    
    -- Gestores de tratamiento
    v_gestor_ibericas_id BIGINT;
    v_gestor_jarama_id BIGINT;
    v_gestor_reciclajes_id BIGINT;
    v_gestor_tajo_id BIGINT;
    
    -- Transportistas
    v_trans_logistica_id BIGINT;
    v_trans_adr_id BIGINT;
    v_trans_express_id BIGINT;
    v_trans_norte_id BIGINT;
    
    -- Contratos
    v_contract_aceites_id BIGINT;
    v_contract_disolventes_id BIGINT;
    v_contract_metales_id BIGINT;
    v_contract_organicos_id BIGINT;
    
    -- Documentos de Identificación
    v_di_1 BIGINT; v_di_2 BIGINT; v_di_3 BIGINT; v_di_4 BIGINT;
    v_di_5 BIGINT; v_di_6 BIGINT; v_di_7 BIGINT; v_di_8 BIGINT;
    v_di_9 BIGINT; v_di_10 BIGINT; v_di_11 BIGINT; v_di_12 BIGINT;
    v_di_13 BIGINT; v_di_14 BIGINT;
    
    -- Memorias Anuales
    v_report_2025_id BIGINT;
    v_report_2026_id BIGINT;
    
    -- GIS / Proyectos
    v_project_id BIGINT;
    v_collection_centros_id BIGINT;
    v_collection_gestores_id BIGINT;
BEGIN
    -- ==========================================================================
    -- 1. CREACIÓN O ACTUALIZACIÓN DEL USUARIO DEMO EN AUTH.USERS
    -- ==========================================================================
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'demo@resigest.com' LIMIT 1;
    
    IF v_user_id IS NULL THEN
        v_user_id := '686cf906-5019-474d-be74-ad3d7db05c0e'::uuid;
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            role,
            aud,
            raw_app_meta_data,
            raw_user_meta_data,
            created_at,
            updated_at
        ) VALUES (
            v_user_id,
            '00000000-0000-0000-0000-000000000000'::uuid,
            'demo@resigest.com',
            crypt('DemoResigest2026!', gen_salt('bf')),
            NOW(),
            'authenticated',
            'authenticated',
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"first_name":"Demo","last_name":"Resigest 360","company_name":"EcoGestión y Soluciones Ambientales 360, S.L."}'::jsonb,
            NOW(),
            NOW()
        );
    ELSE
        UPDATE auth.users
        SET encrypted_password = crypt('DemoResigest2026!', gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            role = 'authenticated',
            aud = 'authenticated',
            raw_user_meta_data = '{"first_name":"Demo","last_name":"Resigest 360","company_name":"EcoGestión y Soluciones Ambientales 360, S.L."}'::jsonb,
            updated_at = NOW()
        WHERE id = v_user_id;
    END IF;

    -- ==========================================================================
    -- 2. PERFIL DE USUARIO (public.profiles)
    -- ==========================================================================
    INSERT INTO public.profiles (
        id, email, first_name, last_name, bio, phone, location, created_at, updated_at
    ) VALUES (
        v_user_id,
        'demo@resigest.com',
        'Demo',
        'Resigest 360',
        'Perfil corporativo oficial de demostración con cobertura completa de residuos peligrosos/no peligrosos, operaciones comerciales, integración SIRA, archivo cronológico y GIS.',
        '+34 912 345 678',
        'Madrid, España',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE SET
        email = EXCLUDED.email,
        first_name = EXCLUDED.first_name,
        last_name = EXCLUDED.last_name,
        bio = EXCLUDED.bio,
        phone = EXCLUDED.phone,
        location = EXCLUDED.location,
        updated_at = NOW();

    -- ==========================================================================
    -- 3. EMPRESA PRINCIPAL TITULAR (is_my_company = true)
    -- ==========================================================================
    SELECT id INTO v_company_id 
    FROM public.companies 
    WHERE user_id = v_user_id AND is_my_company = true 
    LIMIT 1;

    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (
            user_id, razon_social, nombre_comercial, cif, nima, numero_inscripcion,
            domicilio_social, codigo_postal_social, municipio_social, provincia_social,
            domicilio_instalacion, codigo_postal_instalacion, municipio_instalacion, provincia_instalacion,
            telefono, email, persona_contacto, tipo_empresa, roles, is_my_company,
            numero_autorizacion, matricula, sira_usuario, sira_password, sira_activo,
            holded_api_key, activo, notas
        ) VALUES (
            v_user_id,
            'EcoGestión y Soluciones Ambientales 360, S.L.',
            'EcoGestión 360',
            'B88997766',
            '2800012345',
            'INS-MD-2022-88771',
            'Polígono Industrial Las Mercedes, C/ Campezo 14, Nave 3',
            '28022', 'Madrid', 'Madrid',
            'Polígono Industrial Cobo Calleja, C/ Manuel Cobo Calleja 52',
            '28947', 'Fuenlabrada', 'Madrid',
            '+34 910 123 456', 'operaciones@ecogestion360.es',
            'Elena Ramos Navarro (Dpto. Medio Ambiente)',
            'productor',
            ARRAY['productor', 'gestor', 'transportista', 'negociante'],
            true,
            'G-MD-2024/0215',
            '3421-KLR',
            'SIRA_USER_ECO360',
            'SiraPass2026!',
            true,
            'be65b8b8f65621caea444b6c72d37af7',
            true,
            'Empresa de demostración con triple actividad: productora industrial, gestora autorizada R13/D15 y negociante de residuos.'
        )
        RETURNING id INTO v_company_id;
    ELSE
        UPDATE public.companies SET
            razon_social = 'EcoGestión y Soluciones Ambientales 360, S.L.',
            nombre_comercial = 'EcoGestión 360',
            cif = 'B88997766',
            nima = '2800012345',
            domicilio_social = 'Polígono Industrial Las Mercedes, C/ Campezo 14, Nave 3',
            codigo_postal_social = '28022',
            municipio_social = 'Madrid',
            provincia_social = 'Madrid',
            domicilio_instalacion = 'Polígono Industrial Cobo Calleja, C/ Manuel Cobo Calleja 52',
            codigo_postal_instalacion = '28947',
            municipio_instalacion = 'Fuenlabrada',
            provincia_instalacion = 'Madrid',
            telefono = '+34 910 123 456',
            email = 'operaciones@ecogestion360.es',
            persona_contacto = 'Elena Ramos Navarro (Dpto. Medio Ambiente)',
            roles = ARRAY['productor', 'gestor', 'transportista', 'negociante'],
            is_my_company = true,
            numero_autorizacion = 'G-MD-2024/0215',
            matricula = '3421-KLR',
            sira_usuario = 'SIRA_USER_ECO360',
            sira_password = 'SiraPass2026!',
            sira_activo = true,
            holded_api_key = 'be65b8b8f65621caea444b6c72d37af7',
            activo = true
        WHERE id = v_company_id;
    END IF;

    -- ==========================================================================
    -- 4. CATÁLOGO DE EMPRESAS EXTERNAS (PRODUCTORES, NEGOCIANTES, CLIENTES)
    -- ==========================================================================
    -- Limpiar empresas ajenas del usuario demo
    DELETE FROM public.companies WHERE user_id = v_user_id AND is_my_company = false;

    -- Empresa 1: Gran Productor Automoción (Proveedor / Cliente de residuos)
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, domicilio_social,
        codigo_postal_social, municipio_social, provincia_social, telefono, email,
        persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id,
        'Automoción y Componentes del Jarama S.A.',
        'Jarama AutoComponents',
        'A28991122',
        '2800091122',
        'Parque Tecnológico de San Fernando, Avda. Castilla 2',
        '28830', 'San Fernando de Henares', 'Madrid',
        '+34 916 558 899', 'medioambiente@jarama-auto.es',
        'Julián Ortega (Jefe de Planta)',
        'productor',
        ARRAY['productor'],
        false, true,
        'Fabricante de transmisiones y cajas de cambio. Generador de aceites usados, virutas metálicas y embalajes.'
    ) RETURNING id INTO v_comp_automocion_id;

    -- Empresa 2: Gran Productor Químico
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, domicilio_social,
        codigo_postal_social, municipio_social, provincia_social, telefono, email,
        persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id,
        'Química Fina y Polímeros Iberia S.L.',
        'QuimIberia Polímeros',
        'B84123987',
        '2800084123',
        'C/ Química 12, Pol. Ind. La Estación',
        '28320', 'Pinto', 'Madrid',
        '+34 916 910 022', 'residuos@quimiberia.com',
        'Dra. Beatriz Morales',
        'productor',
        ARRAY['productor'],
        false, true,
        'Instalación química con producción periódica de disolventes agotados, reactivos caducados y lodos.'
    ) RETURNING id INTO v_comp_quimica_id;

    -- Empresa 3: Constructora de Obra Civil (Generador de RCD y Metales)
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, domicilio_social,
        codigo_postal_social, municipio_social, provincia_social, telefono, email,
        persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id,
        'Construcciones e Infraestructuras Metropolitanas S.A.',
        'MetroConstrucciones',
        'A28456789',
        '2800076543',
        'Paseo de la Castellana 180',
        '28046', 'Madrid', 'Madrid',
        '+34 913 221 100', 'obras@metroconstrucciones.es',
        'Fernando Varela (Ingeniero de Obra)',
        'productor',
        ARRAY['productor'],
        false, true,
        'Obras de edificación e infraestructuras con volumen elevado de ferralla, perfiles de acero y tierras limpias.'
    ) RETURNING id INTO v_comp_construc_id;

    -- Empresa 4: Negociante de Residuos (Trading ambiental de metales y plásticos)
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_inscripcion,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id,
        'Iberia Waste Trading & Brokerage S.L.',
        'Iberia Waste Trading',
        'B89445566',
        '2800055667',
        'NEG-MD-2023-0044',
        'C/ Velázquez 64, 4º Dcha',
        '28001', 'Madrid', 'Madrid',
        '+34 917 400 300', 'comercial@iberiawaste.com',
        'Gonzalo Alcaide (Director Comercial)',
        'negociante',
        ARRAY['negociante'],
        false, true,
        'Negociante registrado que compra y vende partidas de residuos asumiendo titularidad documental sin almacenamiento físico.'
    ) RETURNING id INTO v_comp_broker_id;

    -- Empresa 5: Agente Medioambiental
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_inscripcion,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id,
        'Agencia Medioambiental de Residuos Circulares S.A.',
        'Agencia Circular',
        'A88334455',
        '2800044332',
        'AGE-MD-2022-0012',
        'Avda. de Europa 18, Parque Empresarial La Moraleja',
        '28108', 'Alcobendas', 'Madrid',
        '+34 914 880 110', 'contacto@agenciacircular.es',
        'Silvia Montero',
        'agente',
        ARRAY['agente'],
        false, true,
        'Agente independiente que gestiona y organiza la valorización en nombre de terceros sin asumir titularidad del residuo.'
    ) RETURNING id INTO v_comp_agente_id;

    -- Empresa 6: Gestor Tratamientos Ibéricos
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id, 'Tratamientos y Valorizaciones Ibéricas S.A.', 'Tratamientos Ibéricos',
        'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45, Pol. Ind. Alcobendas', '28108', 'Alcobendas', 'Madrid',
        '+34 914 901 200', 'planta@tratamientosibericos.es', 'Ing. Marcos Vidal',
        'gestor', ARRAY['gestor'], false, true,
        'Instalación polivalente de tratamiento físico-químico D09 y regeneración R09.'
    ) RETURNING id INTO v_comp_gestor_ibericas_id;

    -- Empresa 7: Gestor Disolventes del Jarama
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id, 'Regeneración de Disolventes del Jarama S.L.', 'Disolventes del Jarama',
        'B82334455', '2800078901', 'G-MD-2020/4412',
        'C/ Sierra de Guadarrama 8, Pol. Ind. San Fernando', '28830', 'San Fernando de Henares', 'Madrid',
        '+34 916 712 345', 'laboratorio@disolventesjarama.es', 'Dra. Lucía Menéndez',
        'gestor', ARRAY['gestor'], false, true,
        'Planta química de regeneración R02 de disolventes.'
    ) RETURNING id INTO v_comp_gestor_jarama_id;

    -- Empresa 8: Gestor Planta Integral de Reciclaje
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id, 'Planta Integral de Reciclaje y Metales S.L.', 'Reciclajes y Metales',
        'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        '+34 916 830 011', 'pesaje@reciclajesmetales.es', 'Santiago Fuentes',
        'gestor', ARRAY['gestor'], false, true,
        'Centro autorizado R04 de metales, chatarras y RAEEs.'
    ) RETURNING id INTO v_comp_gestor_reciclajes_id;

    -- Empresa 9: Gestor Compostaje del Tajo
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id, 'Centro Ambiental de Compostaje y Biomasa del Tajo S.L.', 'Compostaje del Tajo',
        'B88332211', '2800088772', 'G-MD-2023/5510',
        'Carretera de Toledo km 18, Finca Soto del Tajo', '28300', 'Aranjuez', 'Madrid',
        '+34 918 921 543', 'compost@ambientaltajo.es', 'María Ángeles Gil',
        'gestor', ARRAY['gestor'], false, true,
        'Planta de biometanización y compostaje aerobio R03.'
    ) RETURNING id INTO v_comp_gestor_tajo_id;

    -- Empresa 10: Transportista TransAmbiental
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion, matricula,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id, 'TransAmbiental Logística Verde S.L.', 'TransAmbiental',
        'B85667788', '2800033221', 'T-MD-2021/0088', '4521-LXZ',
        'Polígono Industrial El Olivar, C/ Mercurio 5', '28806', 'Alcalá de Henares', 'Madrid',
        '+34 918 223 344', 'trafico@transambiental.es', 'Carlos Morales',
        'transportista', ARRAY['transportista'], false, true,
        'Flota de camiones portacontenedores basculantes.'
    ) RETURNING id INTO v_comp_trans_logistica_id;

    -- Empresa 11: Transportista Trans ADR
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion, matricula,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id, 'Transportes Especiales ADR Circulares S.A.', 'TransCirculares ADR',
        'A84112299', '2800055443', 'T-MD-2019/0412', '8932-KMN',
        'Avda. de los Metales 22, Pol. Ind. La Cantueña', '28944', 'Fuenlabrada', 'Madrid',
        '+34 916 554 433', 'adr@transcirculares.com', 'Patricia Sotomayor',
        'transportista', ARRAY['transportista'], false, true,
        'Cisternas calorifugadas autorizadas para mercancías peligrosas ADR.'
    ) RETURNING id INTO v_comp_trans_adr_id;

    -- Empresa 12: Transportista Logística Express
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion, matricula,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id, 'Logística Ecológica Express S.L.', 'Logística Express',
        'B86991122', '2800066778', 'T-MD-2023/1105', '1204-MBD',
        'C/ de la Fragua 18, Pol. Ind. San Marcos', '28906', 'Getafe', 'Madrid',
        '+34 917 889 900', 'rutas@logisticaexpress.es', 'Javier Prieto',
        'transportista', ARRAY['transportista'], false, true,
        'Vehículos ecológicos propulsados por GNC para envases y papel.'
    ) RETURNING id INTO v_comp_trans_express_id;

    -- Empresa 13: Transportista Ecotrans Norte
    INSERT INTO public.companies (
        user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion, matricula,
        domicilio_social, codigo_postal_social, municipio_social, provincia_social,
        telefono, email, persona_contacto, tipo_empresa, roles, is_my_company, activo, notas
    ) VALUES (
        v_user_id, 'Ecotrans Norte Contenedores y Cubas S.L.', 'Ecotrans Norte',
        'B87112233', '2800077889', 'T-MD-2020/0934', '7741-JWB',
        'Carretera Fuencarral a Alcobendas km 3.8', '28108', 'Alcobendas', 'Madrid',
        '+34 915 443 322', 'cubas@ecotransnorte.es', 'Raúl Domínguez',
        'transportista', ARRAY['transportista'], false, true,
        'Cubas de 10m³ a 35m³ para chatarras y residuos pesados.'
    ) RETURNING id INTO v_comp_trans_norte_id;

    -- ==========================================================================
    -- 5. CENTROS DE PRODUCCIÓN PROPIOS (public.production_centers)
    -- ==========================================================================
    DELETE FROM public.production_centers WHERE company_id = v_company_id;

    INSERT INTO public.production_centers (
        company_id, user_id, nombre, direccion, nima, descripcion, activo
    ) VALUES (
        v_company_id, v_user_id,
        'Planta Central Madrid (Fabricación, Mezclado y Envasado)',
        'Polígono Industrial Las Mercedes, C/ Campezo 14, 28022 Madrid',
        '2800012345-01',
        'Sede principal con líneas de proceso químico, envasado y taller de mantenimiento general.',
        true
    ) RETURNING id INTO v_center_central_id;

    INSERT INTO public.production_centers (
        company_id, user_id, nombre, direccion, nima, descripcion, activo
    ) VALUES (
        v_company_id, v_user_id,
        'Centro Logístico y Transferencia Sur (Fuenlabrada)',
        'Polígono Industrial Cobo Calleja, C/ Manuel Cobo Calleja 52, 28947 Fuenlabrada, Madrid',
        '2800012345-02',
        'Instalación de consolidación, almacenamiento temporal de residuos R13/D15 y lavado de flota.',
        true
    ) RETURNING id INTO v_center_sur_id;

    INSERT INTO public.production_centers (
        company_id, user_id, nombre, direccion, nima, descripcion, activo
    ) VALUES (
        v_company_id, v_user_id,
        'Planta de Valorización y Reciclaje del Corredor (Alcalá de Henares)',
        'Vía Complutense 120, 28805 Alcalá de Henares, Madrid',
        '2800012345-03',
        'Centro técnico de clasificación de envases, trituración mecánica y recuperación de materiales.',
        true
    ) RETURNING id INTO v_center_corredor_id;

    -- ==========================================================================
    -- 6. TRANSPORTISTAS REGISTRADOS (public.carriers)
    -- ==========================================================================
    DELETE FROM public.carriers WHERE user_id = v_user_id;

    INSERT INTO public.carriers (
        user_id, razon_social, cif, nima, numero_autorizacion, matricula,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'TransAmbiental Logística Verde S.L.',
        'B85667788',
        '2800033221',
        'T-MD-2021/0088',
        '4521-LXZ',
        'Polígono Industrial El Olivar, C/ Mercurio 5',
        '28806', 'Alcalá de Henares', 'Madrid',
        '+34 918 223 344', 'trafico@transambiental.es',
        'Carlos Morales (Jefe de Tráfico)',
        true,
        'Flota de camiones portacontenedores basculantes y camiones pulpo para chatarras y residuos sólidos.'
    ) RETURNING id INTO v_trans_logistica_id;

    INSERT INTO public.carriers (
        user_id, razon_social, cif, nima, numero_autorizacion, matricula,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Transportes Especiales ADR Circulares S.A.',
        'A84112299',
        '2800055443',
        'T-MD-2019/0412',
        '8932-KMN',
        'Avda. de los Metales 22, Pol. Ind. La Cantueña',
        '28944', 'Fuenlabrada', 'Madrid',
        '+34 916 554 433', 'adr@transcirculares.com',
        'Patricia Sotomayor (Consejera de Seguridad ADR)',
        true,
        'Cisternas calorifugadas de acero inoxidable y furgones autorizados para mercancías peligrosas ADR.'
    ) RETURNING id INTO v_trans_adr_id;

    INSERT INTO public.carriers (
        user_id, razon_social, cif, nima, numero_autorizacion, matricula,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Logística Ecológica Express S.L.',
        'B86991122',
        '2800066778',
        'T-MD-2023/1105',
        '1204-MBD',
        'C/ de la Fragua 18, Pol. Ind. San Marcos',
        '28906', 'Getafe', 'Madrid',
        '+34 917 889 900', 'rutas@logisticaexpress.es',
        'Javier Prieto',
        true,
        'Vehículos ecológicos propulsados por GNC para recogida urbana e industrial de envases ligeros y cartón.'
    ) RETURNING id INTO v_trans_express_id;

    INSERT INTO public.carriers (
        user_id, razon_social, cif, nima, numero_autorizacion, matricula,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Ecotrans Norte Contenedores y Cubas S.L.',
        'B87112233',
        '2800077889',
        'T-MD-2020/0934',
        '7741-JWB',
        'Carretera Fuencarral a Alcobendas km 3.8',
        '28108', 'Alcobendas', 'Madrid',
        '+34 915 443 322', 'cubas@ecotransnorte.es',
        'Raúl Domínguez',
        true,
        'Servicio de alquiler e intercambio de cubas de 10m³ a 35m³ para obras, desguaces e industrias pesadas.'
    ) RETURNING id INTO v_trans_norte_id;

    -- ==========================================================================
    -- 7. GESTORES DE TRATAMIENTO (public.treatment_managers con 'nombre' NOT NULL)
    -- ==========================================================================
    DELETE FROM public.treatment_managers WHERE user_id = v_user_id;

    INSERT INTO public.treatment_managers (
        user_id, nombre, razon_social, cif, nima, numero_autorizacion,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Tratamientos y Valorizaciones Ibéricas',
        'Tratamientos y Valorizaciones Ibéricas S.A.',
        'A28112233',
        '2800045678',
        'G-MD-2022/9901',
        'Avda. de la Industria 45, Pol. Ind. Alcobendas',
        '28108', 'Alcobendas', 'Madrid',
        '+34 914 901 200', 'planta@tratamientosibericos.es',
        'Ing. Marcos Vidal (Director Técnico)',
        true,
        'Instalación polivalente de tratamiento físico-químico D09, regeneración de aceites R09 e incineración D10.'
    ) RETURNING id INTO v_gestor_ibericas_id;

    INSERT INTO public.treatment_managers (
        user_id, nombre, razon_social, cif, nima, numero_autorizacion,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Regeneración de Disolventes del Jarama',
        'Regeneración de Disolventes del Jarama S.L.',
        'B82334455',
        '2800078901',
        'G-MD-2020/4412',
        'C/ Sierra de Guadarrama 8, Pol. Ind. San Fernando',
        '28830', 'San Fernando de Henares', 'Madrid',
        '+34 916 712 345', 'laboratorio@disolventesjarama.es',
        'Dra. Lucía Menéndez',
        true,
        'Planta química autorizada para destilación fraccionada y recuperación de disolventes orgánicos (R02).'
    ) RETURNING id INTO v_gestor_jarama_id;

    INSERT INTO public.treatment_managers (
        user_id, nombre, razon_social, cif, nima, numero_autorizacion,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Planta Integral de Reciclaje y Metales',
        'Planta Integral de Reciclaje y Metales S.L.',
        'B83445566',
        '2800099881',
        'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19',
        '28906', 'Getafe', 'Madrid',
        '+34 916 830 011', 'pesaje@reciclajesmetales.es',
        'Santiago Fuentes',
        true,
        'Centro autorizado de valorización R04 de chatarras férreas, metales nobles, RAEEs y corte por cizalla.'
    ) RETURNING id INTO v_gestor_reciclajes_id;

    INSERT INTO public.treatment_managers (
        user_id, nombre, razon_social, cif, nima, numero_autorizacion,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Centro Ambiental de Compostaje del Tajo',
        'Centro Ambiental de Compostaje y Biomasa del Tajo S.L.',
        'B88332211',
        '2800088772',
        'G-MD-2023/5510',
        'Carretera de Toledo km 18, Finca Soto del Tajo',
        '28300', 'Aranjuez', 'Madrid',
        '+34 918 921 543', 'compost@ambientaltajo.es',
        'María Ángeles Gil',
        true,
        'Planta de biometanización, digestión anaerobia y compostaje controlado R03 para fracción orgánica.'
    ) RETURNING id INTO v_gestor_tajo_id;

    -- ==========================================================================
    -- 8. CONTRATOS DE TRATAMIENTO (public.waste_contracts)
    -- ==========================================================================
    DELETE FROM public.waste_contracts WHERE user_id = v_user_id;

    INSERT INTO public.waste_contracts (
        user_id, company_id, gestor_company_id, treatment_manager_id, numero_contrato,
        fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
        descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual,
        unidad_cantidad, precio_unitario, moneda, estado, notas
    ) VALUES 
    (
        v_user_id, v_company_id, v_comp_gestor_ibericas_id, v_gestor_ibericas_id, 'CTR-2026/001-VAL',
        '2026-01-10', '2026-01-15', '2027-01-14', 'tratamiento',
        'Aceites minerales usados (130205*), absorbentes y trapos contaminados (150202*), filtros (160107*) y envases contaminados (150110*).',
        ARRAY['R09', 'R04', 'D09', 'D10'], 65.00, 'toneladas', 185.00, 'EUR',
        'vigente', 'Contrato marco de valorización conforme al RD 553/2020.'
    ) RETURNING id INTO v_contract_aceites_id;

    INSERT INTO public.waste_contracts (
        user_id, company_id, gestor_company_id, treatment_manager_id, numero_contrato,
        fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
        descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual,
        unidad_cantidad, precio_unitario, moneda, estado, notas
    ) VALUES 
    (
        v_user_id, v_company_id, v_comp_gestor_jarama_id, v_gestor_jarama_id, 'CTR-2026/002-DIS',
        '2026-01-12', '2026-02-01', '2027-01-31', 'tratamiento',
        'Disolventes orgánicos no halogenados (140603*), residuos de pintura (080111*) y aguas de lavado químico.',
        ARRAY['R02', 'D09'], 35.00, 'toneladas', 310.00, 'EUR',
        'vigente', 'Regeneración por columnas de rectificación y economía circular.'
    ) RETURNING id INTO v_contract_disolventes_id;

    INSERT INTO public.waste_contracts (
        user_id, company_id, gestor_company_id, treatment_manager_id, numero_contrato,
        fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
        descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual,
        unidad_cantidad, precio_unitario, moneda, estado, notas
    ) VALUES 
    (
        v_user_id, v_company_id, v_comp_gestor_reciclajes_id, v_gestor_reciclajes_id, 'CTR-2026/003-MET',
        '2026-01-08', '2026-01-10', '2028-01-09', 'valoracion',
        'Chatarra de hierro y acero (170405), virutas (120101), embalajes de papel/cartón (150101) y plásticos (150102).',
        ARRAY['R03', 'R04'], 180.00, 'toneladas', 90.00, 'EUR',
        'vigente', 'Acuerdo marco de compraventa y valorización con liquidación según índice LME.'
    ) RETURNING id INTO v_contract_metales_id;

    INSERT INTO public.waste_contracts (
        user_id, company_id, gestor_company_id, treatment_manager_id, numero_contrato,
        fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
        descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual,
        unidad_cantidad, precio_unitario, moneda, estado, notas
    ) VALUES 
    (
        v_user_id, v_company_id, v_comp_gestor_tajo_id, v_gestor_tajo_id, 'CTR-2026/004-BIO',
        '2026-02-01', '2026-02-15', '2027-02-14', 'valoracion',
        'Residuos biodegradables de comedores (200108) y restos vegetales de poda (020103).',
        ARRAY['R03'], 45.00, 'toneladas', 65.00, 'EUR',
        'vigente', 'Compostaje aerobio en túnel con certificación ecológica clase A.'
    ) RETURNING id INTO v_contract_organicos_id;

    -- ==========================================================================
    -- 9. DOCUMENTOS DE IDENTIFICACIÓN - DIs (14 DIs COMPLETOS SEGÚN RD 553/2020)
    -- ==========================================================================
    DELETE FROM public.identification_documents WHERE user_id = v_user_id;

    -- DI 1: Aceite mineral de motor (Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0001', '2026-02-04',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'liquido', 'peligroso',
        1250.000, 'kg', 1, 'Contenedor GRG 1000L homologado UN', 'R09', 'Regeneración de aceites usados',
        '2026-02-04', '2026-02-04', true, true, true, '2026-02-04', '2026-02-04', '2026-02-04',
        'completado', 'Retirada trimestral de aceites de mantenimiento de compresores y motores.'
    ) RETURNING id INTO v_di_1;

    -- DI 2: Disolventes orgánicos (Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_disolventes_id, 'DI-2026-0002', '2026-02-18',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Regeneración de Disolventes del Jarama S.L.', 'B82334455', '2800078901', 'G-MD-2020/4412',
        'C/ Sierra de Guadarrama 8', '28830', 'San Fernando de Henares', 'Madrid',
        'Transportes Especiales ADR Circulares S.A.', 'A84112299', '8932-KMN',
        '14 06 03*', 'Otros disolventes y mezclas de disolventes', 'liquido', 'peligroso',
        600.000, 'kg', 3, 'Bidones de acero homologados 200L', 'R02', 'Recuperación o regeneración de disolventes',
        '2026-02-18', '2026-02-18', true, true, true, '2026-02-18', '2026-02-18', '2026-02-18',
        'completado', 'Transporte amparado por carta de porte ADR clase 3.'
    ) RETURNING id INTO v_di_2;

    -- DI 3: Envases contaminados (Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0003', '2026-03-05',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-02',
        'C/ Manuel Cobo Calleja 52', '28947', 'Fuenlabrada', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '15 01 10*', 'Envases que contienen restos de sustancias peligrosas', 'solido', 'peligroso',
        480.000, 'kg', 2, 'Big-Bags impermeables 1m³ con liner', 'R04', 'Reciclado o recuperación de metales',
        '2026-03-05', '2026-03-05', true, true, true, '2026-03-05', '2026-03-05', '2026-03-05',
        'completado', 'Latas vacías de lubricantes y adhesivos escurridos.'
    ) RETURNING id INTO v_di_3;

    -- DI 4: Trapos y absorbentes (Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0004', '2026-03-24',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '15 02 02*', 'Absorbentes, materiales de filtración y trapos de limpieza contaminados', 'solido', 'peligroso',
        340.000, 'kg', 2, 'Contenedores estancos 240L', 'D10', 'Incineración con recuperación energética',
        '2026-03-24', '2026-03-24', true, true, true, '2026-03-24', '2026-03-24', '2026-03-24',
        'completado', 'Sepiolita y trapos usados en el taller de mantenimiento.'
    ) RETURNING id INTO v_di_4;

    -- DI 5: Pinturas y Barnices (Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_disolventes_id, 'DI-2026-0005', '2026-04-10',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Regeneración de Disolventes del Jarama S.L.', 'B82334455', '2800078901', 'G-MD-2020/4412',
        'C/ Sierra de Guadarrama 8', '28830', 'San Fernando de Henares', 'Madrid',
        'Transportes Especiales ADR Circulares S.A.', 'A84112299', '8932-KMN',
        '08 01 11*', 'Residuos de pintura y barniz con disolventes orgánicos', 'pastoso', 'peligroso',
        520.000, 'kg', 2, 'Bidones metálicos con fleje 200L', 'D09', 'Tratamiento físico-químico',
        '2026-04-10', '2026-04-10', true, true, true, '2026-04-10', '2026-04-10', '2026-04-10',
        'completado', 'Purgas de cabinas de pintura y fondos de cubas.'
    ) RETURNING id INTO v_di_5;

    -- DI 6: Filtros de Aceite (Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0006', '2026-05-14',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-02',
        'C/ Manuel Cobo Calleja 52', '28947', 'Fuenlabrada', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '16 01 07*', 'Filtros de aceite', 'solido', 'peligroso',
        290.000, 'kg', 1, 'Bidón de acero 200L', 'R04', 'Reciclado de metales férreos y desclasificación',
        '2026-05-14', '2026-05-14', true, true, true, '2026-05-14', '2026-05-14', '2026-05-14',
        'completado', 'Filtros de aceite prensados procedentes de vehículos y maquinaria.'
    ) RETURNING id INTO v_di_6;

    -- DI 7: Papel y Cartón (No Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0007', '2026-06-02',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'Logística Ecológica Express S.L.', 'B86991122', '1204-MBD',
        '15 01 01', 'Envases de papel y cartón', 'solido', 'no-peligroso',
        4350.000, 'kg', 8, 'Balas compactadas flejadas', 'R03', 'Reciclado de sustancias orgánicas',
        '2026-06-02', '2026-06-02', true, true, true, '2026-06-02', '2026-06-02', '2026-06-02',
        'completado', 'Embalajes limpios de cartón ondulado prensado en origen.'
    ) RETURNING id INTO v_di_7;

    -- DI 8: Plásticos (No Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0008', '2026-06-25',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-03',
        'Vía Complutense 120', '28805', 'Alcalá de Henares', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'Logística Ecológica Express S.L.', 'B86991122', '1204-MBD',
        '15 01 02', 'Envases de plástico', 'solido', 'no-peligroso',
        2900.000, 'kg', 5, 'Balas de film PEBD', 'R03', 'Reciclado mecánico y granza',
        '2026-06-25', '2026-06-25', true, true, true, '2026-06-25', '2026-06-25', '2026-06-25',
        'completado', 'Film transparente y flejes de paletizado de alta densidad.'
    ) RETURNING id INTO v_di_8;

    -- DI 9: Hierro y Acero (No Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0009', '2026-07-16',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-02',
        'C/ Manuel Cobo Calleja 52', '28947', 'Fuenlabrada', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'Ecotrans Norte Contenedores y Cubas S.L.', 'B87112233', '7741-JWB',
        '17 04 05', 'Hierro y acero', 'solido', 'no-peligroso',
        8720.000, 'kg', 1, 'Cuba de 30m³', 'R04', 'Reciclado de metales en acería',
        '2026-07-16', '2026-07-16', true, true, true, '2026-07-16', '2026-07-16', '2026-07-16',
        'completado', 'Estructuras metálicas y tubos desmantelados de instalaciones.'
    ) RETURNING id INTO v_di_9;

    -- DI 10: Virutas de Mecanizado (No Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0010', '2026-08-05',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'Ecotrans Norte Contenedores y Cubas S.L.', 'B87112233', '7741-JWB',
        '12 01 01', 'Limaduras y virutas de metales férreos', 'solido', 'no-peligroso',
        3200.000, 'kg', 2, 'Contenedores metálicos 1500L', 'R04', 'Reciclado y fundición de viruta',
        '2026-08-05', '2026-08-05', true, true, true, '2026-08-05', '2026-08-05', '2026-08-05',
        'completado', 'Viruta limpia de mecanizado en tornos y fresadoras CNC.'
    ) RETURNING id INTO v_di_10;

    -- DI 11: Residuos orgánicos (No Peligroso - Pendiente de Firma)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_organicos_id, 'DI-2026-0011', '2026-09-18',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Centro Ambiental de Compostaje y Biomasa del Tajo S.L.', 'B88332211', '2800088772', 'G-MD-2023/5510',
        'Carretera de Toledo km 18', '28300', 'Aranjuez', 'Madrid',
        'Logística Ecológica Express S.L.', 'B86991122', '1204-MBD',
        '20 01 08', 'Residuos biodegradables de cocinas y restaurantes', 'solido', 'no-peligroso',
        1950.000, 'kg', 8, 'Contenedores marrones 240L', 'R03', 'Compostaje aerobio',
        '2026-09-18', NULL, true, false, true, '2026-09-18', '2026-09-18',
        'pendiente-firma', 'Pendiente de confirmación telemática del peso neto por el gestor de destino.'
    ) RETURNING id INTO v_di_11;

    -- DI 12: Baterías de Plomo (Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0012', '2026-09-29',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-02',
        'C/ Manuel Cobo Calleja 52', '28947', 'Fuenlabrada', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'Transportes Especiales ADR Circulares S.A.', 'A84112299', '8932-KMN',
        '16 06 01*', 'Baterías de plomo', 'solido', 'peligroso',
        850.000, 'kg', 1, 'Caja de polietileno ácido-resistente homologada', 'R04', 'Reciclado de plomo y neutralización de ácido',
        '2026-09-29', '2026-09-29', true, true, true, '2026-09-29', '2026-09-29', '2026-09-29',
        'completado', 'Baterías sustituidas en carretillas elevadoras y SAIs.'
    ) RETURNING id INTO v_di_12;

    -- DI 13: RAEEs / Equipos electrónicos desechados (Peligroso - Completado)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista, estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0013', '2026-10-06',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '16 02 13*', 'Equipos desechados que contienen componentes peligrosos (RAEEs)', 'solido', 'peligroso',
        720.000, 'kg', 2, 'Jaulas metálicas homologadas para RAEE', 'R04', 'Descontaminación y desmontaje selectivo',
        '2026-10-06', '2026-10-06', true, true, true, '2026-10-06', '2026-10-06', '2026-10-06',
        'completado', 'Sustitución de armarios de control y autómatas PLC obsoletos.'
    ) RETURNING id INTO v_di_13;

    -- DI 14: Aceite mineral de motor (Borrador en preparación para salida próxima)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases, operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0014', '2026-10-16',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'liquido', 'peligroso',
        1100.000, 'kg', 1, 'Contenedor GRG 1000L', 'R09', 'Regeneración de aceites usados',
        NULL, NULL, false, false, false,
        'borrador', 'Documento borrador preparado para la recogida de final de mes.'
    ) RETURNING id INTO v_di_14;

    -- ==========================================================================
    -- 10. ARCHIVO CRONOLÓGICO OBLIGATORIO (public.chronological_registry - 26 ASIENTOS)
    -- ==========================================================================
    DELETE FROM public.chronological_registry WHERE user_id = v_user_id;

    INSERT INTO public.chronological_registry (
        user_id, company_id, production_center_id, numero_asiento, fecha,
        tipo_operacion, codigo_ler, descripcion_residuo, peligrosidad, codigo_hp, estado_fisico,
        cantidad_kg, envase_tipo, envase_unidades, origen_tipo, origen_razon_social, origen_nima,
        transportista_nif, transportista_razon_social, transportista_nima, transportista_matricula,
        destino_tipo, destino_razon_social, destino_nif, destino_nima, destino_autorizacion,
        operacion_rd, operacion_rd_descripcion, identification_document_id, numero_documento_referencia,
        observaciones
    ) VALUES
    -- 01: Gen Aceites
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0001', '2026-01-20', 'produccion_interna', '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'peligroso', ARRAY['HP5'], 'liquido', 650.000, 'GRG 1000L', 1, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PARTE-MANT-01/26', 'Mantenimiento preventivo bancada de compresión.'),
    -- 02: Gen Aceites 2
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0002', '2026-02-02', 'produccion_interna', '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'peligroso', ARRAY['HP5'], 'liquido', 600.000, 'GRG 1000L', 1, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PARTE-MANT-02/26', 'Llenado y precinto de GRG.'),
    -- 03: Salida Traslado Aceites (DI-2026-0001)
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0003', '2026-02-04', 'salida_traslado', '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'peligroso', ARRAY['HP5'], 'liquido', 1250.000, 'GRG 1000L', 1, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', 'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ', 'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901', 'R09', 'Regeneración de aceites usados', v_di_1, 'DI-2026-0001', 'Pesaje en báscula: 1.250 kg netos.'),
    -- 04: Gen Disolventes
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0004', '2026-02-15', 'produccion_interna', '14 06 03*', 'Otros disolventes y mezclas de disolventes', 'peligroso', ARRAY['HP3', 'HP4', 'HP6'], 'liquido', 600.000, 'Bidones 200L', 3, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'PROD-QUIM-02/26', 'Limpieza y purga de circuitos de trasvase.'),
    -- 05: Salida Disolventes (DI-2026-0002)
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0005', '2026-02-18', 'salida_traslado', '14 06 03*', 'Otros disolventes y mezclas de disolventes', 'peligroso', ARRAY['HP3', 'HP4', 'HP6'], 'liquido', 600.000, 'Bidones 200L', 3, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', 'A84112299', 'Transportes Especiales ADR Circulares S.A.', '2800055443', '8932-KMN', 'tercero_gestor', 'Regeneración de Disolventes del Jarama S.L.', 'B82334455', '2800078901', 'G-MD-2020/4412', 'R02', 'Regeneración de disolventes', v_di_2, 'DI-2026-0002', 'Expedición ADR con carta de porte.'),
    -- 06: Gen Envases Peligrosos Centro Sur
    (v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0006', '2026-02-28', 'produccion_interna', '15 01 10*', 'Envases que contienen restos de sustancias peligrosas', 'peligroso', ARRAY['HP4', 'HP14'], 'solido', 480.000, 'Big-Bag 1m³', 2, 'propio', 'EcoGestión 360 (Centro Sur)', '2800012345-02', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'ALMACEN-SUR-02/26', 'Acopio de envases vacíos escurridos.'),
    -- 07: Salida Envases Peligrosos (DI-2026-0003)
    (v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0007', '2026-03-05', 'salida_traslado', '15 01 10*', 'Envases que contienen restos de sustancias peligrosas', 'peligroso', ARRAY['HP4', 'HP14'], 'solido', 480.000, 'Big-Bag 1m³', 2, 'propio', 'EcoGestión 360 (Centro Sur)', '2800012345-02', 'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ', 'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901', 'R04', 'Reciclado de metales', v_di_3, 'DI-2026-0003', 'Entrega para descontaminación y triturado.'),
    -- 08: Gen Trapos
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0008', '2026-03-20', 'produccion_interna', '15 02 02*', 'Absorbentes y trapos contaminados', 'peligroso', ARRAY['HP5'], 'solido', 340.000, 'Contenedores 240L', 2, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'TALLER-MANT-03/26', 'Limpieza de derrames y grasa.'),
    -- 09: Salida Trapos (DI-2026-0004)
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0009', '2026-03-24', 'salida_traslado', '15 02 02*', 'Absorbentes y trapos contaminados', 'peligroso', ARRAY['HP5'], 'solido', 340.000, 'Contenedores 240L', 2, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', 'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ', 'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901', 'D10', 'Incineración con recuperación energética', v_di_4, 'DI-2026-0004', 'Valorización térmica R01/D10.'),
    -- 10: Gen Pinturas
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0010', '2026-04-05', 'produccion_interna', '08 01 11*', 'Residuos de pintura y barniz con disolventes', 'peligroso', ARRAY['HP3', 'HP5'], 'pastoso', 520.000, 'Bidones 200L', 2, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'CABINA-PINT-04/26', 'Limpieza de cabina de pintura.'),
    -- 11: Salida Pinturas (DI-2026-0005)
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0011', '2026-04-10', 'salida_traslado', '08 01 11*', 'Residuos de pintura y barniz con disolventes', 'peligroso', ARRAY['HP3', 'HP5'], 'pastoso', 520.000, 'Bidones 200L', 2, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', 'A84112299', 'Transportes Especiales ADR Circulares S.A.', '2800055443', '8932-KMN', 'tercero_gestor', 'Regeneración de Disolventes del Jarama S.L.', 'B82334455', '2800078901', 'G-MD-2020/4412', 'D09', 'Tratamiento físico-químico', v_di_5, 'DI-2026-0005', 'Solidificación e inertización.'),
    -- 12: Gen Filtros
    (v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0012', '2026-05-10', 'produccion_interna', '16 01 07*', 'Filtros de aceite', 'peligroso', ARRAY['HP5'], 'solido', 290.000, 'Bidón 200L', 1, 'propio', 'EcoGestión 360 (Centro Sur)', '2800012345-02', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'MANT-FLOTA-05/26', 'Mantenimiento semestral de flota.'),
    -- 13: Salida Filtros (DI-2026-0006)
    (v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0013', '2026-05-14', 'salida_traslado', '16 01 07*', 'Filtros de aceite', 'peligroso', ARRAY['HP5'], 'solido', 290.000, 'Bidón 200L', 1, 'propio', 'EcoGestión 360 (Centro Sur)', '2800012345-02', 'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ', 'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901', 'R04', 'Reciclado de metales férreos', v_di_6, 'DI-2026-0006', 'Drenaje por centrifugación y separación.'),
    -- 14: Gen Cartón Planta Central
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0014', '2026-05-30', 'produccion_interna', '15 01 01', 'Envases de papel y cartón', 'no-peligroso', NULL, 'solido', 4350.000, 'Balas prensadas', 8, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'EMBALAJE-05/26', 'Prensado en prensa automática.'),
    -- 15: Salida Cartón (DI-2026-0007)
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0015', '2026-06-02', 'salida_traslado', '15 01 01', 'Envases de papel y cartón', 'no-peligroso', NULL, 'solido', 4350.000, 'Balas prensadas', 8, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', 'B86991122', 'Logística Ecológica Express S.L.', '2800066778', '1204-MBD', 'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321', 'R03', 'Reciclado de sustancias orgánicas', v_di_7, 'DI-2026-0007', 'Entrega en papelera de reciclaje.'),
    -- 16: Gen Plásticos Alcalá
    (v_user_id, v_company_id, v_center_corredor_id, 'AS-2026-0016', '2026-06-20', 'produccion_interna', '15 01 02', 'Envases de plástico', 'no-peligroso', NULL, 'solido', 2900.000, 'Balas prensadas', 5, 'propio', 'EcoGestión 360 (Planta Corredor)', '2800012345-03', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'RECICLAJE-06/26', 'Compactación de film PEBD.'),
    -- 17: Salida Plásticos (DI-2026-0008)
    (v_user_id, v_company_id, v_center_corredor_id, 'AS-2026-0017', '2026-06-25', 'salida_traslado', '15 01 02', 'Envases de plástico', 'no-peligroso', NULL, 'solido', 2900.000, 'Balas prensadas', 5, 'propio', 'EcoGestión 360 (Planta Corredor)', '2800012345-03', 'B86991122', 'Logística Ecológica Express S.L.', '2800066778', '1204-MBD', 'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321', 'R03', 'Reciclado mecánico y granza', v_di_8, 'DI-2026-0008', 'Granza de polietileno.'),
    -- 18: Gen Acero Fuenlabrada
    (v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0018', '2026-07-10', 'produccion_interna', '17 04 05', 'Hierro y acero', 'no-peligroso', NULL, 'solido', 8720.000, 'Cuba 30m³', 1, 'propio', 'EcoGestión 360 (Centro Sur)', '2800012345-02', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'OBRA-REFORMA-07/26', 'Sustitución de pasarelas y soportes.'),
    -- 19: Salida Acero (DI-2026-0009)
    (v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0019', '2026-07-16', 'salida_traslado', '17 04 05', 'Hierro y acero', 'no-peligroso', NULL, 'solido', 8720.000, 'Cuba 30m³', 1, 'propio', 'EcoGestión 360 (Centro Sur)', '2800012345-02', 'B87112233', 'Ecotrans Norte Contenedores y Cubas S.L.', '2800077889', '7741-JWB', 'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321', 'R04', 'Reciclado en acería', v_di_9, 'DI-2026-0009', 'Certificado de pesada nº 88412.'),
    -- 20: Gen Virutas
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0020', '2026-07-31', 'produccion_interna', '12 01 01', 'Limaduras y virutas de metales férreos', 'no-peligroso', NULL, 'solido', 3200.000, 'Contenedores 1500L', 2, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'MECANIZADO-07/26', 'Viruta limpia de tornos y fresas.'),
    -- 21: Salida Virutas (DI-2026-0010)
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0021', '2026-08-05', 'salida_traslado', '12 01 01', 'Limaduras y virutas de metales férreos', 'no-peligroso', NULL, 'solido', 3200.000, 'Contenedores 1500L', 2, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', 'B87112233', 'Ecotrans Norte Contenedores y Cubas S.L.', '2800077889', '7741-JWB', 'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321', 'R04', 'Reciclado y fundición', v_di_10, 'DI-2026-0010', 'Entrega directa en fundición.'),
    -- 22: Merma justificada
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0022', '2026-08-31', 'merma_ajuste', '14 06 03*', 'Otros disolventes y mezclas de disolventes', 'peligroso', ARRAY['HP3'], 'liquido', 15.000, 'Bidón 200L', 1, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'INV-TRIMESTRAL-Q3', 'Ajuste justificado por evaporación en cubeta de retención.'),
    -- 23: Gen Baterías de Plomo
    (v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0023', '2026-09-25', 'produccion_interna', '16 06 01*', 'Baterías de plomo', 'peligroso', ARRAY['HP8'], 'solido', 850.000, 'Caja estanca', 1, 'propio', 'EcoGestión 360 (Centro Sur)', '2800012345-02', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'RECAMBIO-BAT-09/26', 'Sustitución de baterías de tracción.'),
    -- 24: Salida Baterías (DI-2026-0012)
    (v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0024', '2026-09-29', 'salida_traslado', '16 06 01*', 'Baterías de plomo', 'peligroso', ARRAY['HP8'], 'solido', 850.000, 'Caja estanca', 1, 'propio', 'EcoGestión 360 (Centro Sur)', '2800012345-02', 'A84112299', 'Transportes Especiales ADR Circulares S.A.', '2800055443', '8932-KMN', 'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901', 'R04', 'Recuperación de plomo', v_di_12, 'DI-2026-0012', 'Transporte autorizado ADR.'),
    -- 25: Gen RAEEs
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0025', '2026-10-02', 'produccion_interna', '16 02 13*', 'Equipos desechados que contienen componentes peligrosos (RAEE)', 'peligroso', ARRAY['HP5', 'HP6'], 'solido', 720.000, 'Jaulas homologadas', 2, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL, 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, NULL, NULL, 'RENOVACION-IT-10/26', 'Desmantelamiento de electrónica industrial.'),
    -- 26: Salida RAEEs (DI-2026-0013)
    (v_user_id, v_company_id, v_center_central_id, 'AS-2026-0026', '2026-10-06', 'salida_traslado', '16 02 13*', 'Equipos desechados que contienen componentes peligrosos (RAEE)', 'peligroso', ARRAY['HP5', 'HP6'], 'solido', 720.000, 'Jaulas homologadas', 2, 'propio', 'EcoGestión 360 (Planta Central)', '2800012345-01', 'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ', 'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321', 'R04', 'Descontaminación RAEE', v_di_13, 'DI-2026-0013', 'Entrega para desmontaje selectivo.');

    -- ==========================================================================
    -- 11. OPERACIONES COMERCIALES (public.commercial_operations - MÁRGENES Y NEGOCIACIÓN)
    -- ==========================================================================
    DELETE FROM public.commercial_operations WHERE user_id = v_user_id;

    -- Operación 1: Venta y Valorización de Lote de Chatarra Férrea
    INSERT INTO public.commercial_operations (
        user_id, company_id, numero_operacion, fecha, estado,
        origen_productor_id, origen_center_id, origen_nombre_personalizado, origen_nima, origen_cif,
        destino_gestor_id, destino_nombre_personalizado, destino_nima, destino_cif, destino_autorizacion,
        transportista_id, transportista_nombre_personalizado, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, peligrosidad, operacion_rd,
        cantidad_estimada_t, cantidad_real_t, identification_document_id, numero_albaran_gestor,
        proveedor_comercial_id, proveedor_razon_social, proveedor_cif, tipo_precio_compra, precio_unitario_compra, coste_compra_total, factura_compra_ref, estado_pago_compra,
        cliente_comercial_id, cliente_razon_social, cliente_cif, tipo_precio_venta, precio_unitario_venta, ingreso_venta_total, factura_venta_ref, estado_cobro_venta,
        coste_transporte, otros_costes, descripcion_otros_costes, margen_bruto_total, margen_unitario_tonelada, porcentaje_margen, observaciones
    ) VALUES (
        v_user_id, v_company_id, 'OP-2026-0001', '2026-07-16', 'liquidada',
        v_company_id, v_center_sur_id, 'EcoGestión 360 (Centro Sur)', '2800012345-02', 'B88997766',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 'B83445566', 'G-MD-2021/3321',
        v_comp_trans_norte_id, 'Ecotrans Norte Contenedores y Cubas S.L.', 'B87112233', '7741-JWB',
        '17 04 05', 'Hierro y acero estructural de derribo', 'no-peligroso', 'R04',
        8.500, 8.720, v_di_9, 'ALB-GESTOR-88412',
        v_comp_construc_id, 'Construcciones e Infraestructuras Metropolitanas S.A.', 'A28456789', 'por_tonelada', 120.00, 1046.40, 'FAC-COMP-2026-041', 'pagado',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', 'por_tonelada', 245.00, 2136.40, 'FAC-VTA-2026-089', 'cobrado',
        380.00, 50.00, 'Canon de pesaje oficial y certificación de descontaminación', 660.00, 75.69, 30.89, 'Operación cerrada y liquidada con margen neto superior al objetivo.'
    );

    -- Operación 2: Intermediación de Disolventes Químicos (ADR)
    INSERT INTO public.commercial_operations (
        user_id, company_id, numero_operacion, fecha, estado,
        origen_productor_id, origen_center_id, origen_nombre_personalizado, origen_nima, origen_cif,
        destino_gestor_id, destino_nombre_personalizado, destino_nima, destino_cif, destino_autorizacion,
        transportista_id, transportista_nombre_personalizado, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, peligrosidad, operacion_rd,
        cantidad_estimada_t, cantidad_real_t, identification_document_id, numero_albaran_gestor,
        proveedor_comercial_id, proveedor_razon_social, proveedor_cif, tipo_precio_compra, precio_unitario_compra, coste_compra_total, factura_compra_ref, estado_pago_compra,
        cliente_comercial_id, cliente_razon_social, cliente_cif, tipo_precio_venta, precio_unitario_venta, ingreso_venta_total, factura_venta_ref, estado_cobro_venta,
        coste_transporte, otros_costes, descripcion_otros_costes, margen_bruto_total, margen_unitario_tonelada, porcentaje_margen, observaciones
    ) VALUES (
        v_user_id, v_company_id, 'OP-2026-0002', '2026-02-18', 'completada',
        v_comp_quimica_id, NULL, 'Química Fina y Polímeros Iberia S.L.', '2800084123', 'B84123987',
        v_comp_gestor_jarama_id, 'Regeneración de Disolventes del Jarama S.L.', '2800078901', 'B82334455', 'G-MD-2020/4412',
        v_comp_trans_adr_id, 'Transportes Especiales ADR Circulares S.A.', 'A84112299', '8932-KMN',
        '14 06 03*', 'Mezclas de disolventes de enjuague', 'peligroso', 'R02',
        6.000, 6.000, v_di_2, 'ALB-JARAMA-1102',
        v_comp_quimica_id, 'Química Fina y Polímeros Iberia S.L.', 'B84123987', 'por_tonelada', 150.00, 900.00, 'FAC-COMP-2026-015', 'pagado',
        v_comp_gestor_jarama_id, 'Regeneración de Disolventes del Jarama S.L.', 'B82334455', 'por_tonelada', 480.00, 2880.00, 'FAC-VTA-2026-031', 'cobrado',
        620.00, 80.00, 'Gestión de carta de porte ADR y tasa ambiental', 1280.00, 213.33, 44.44, 'Intermediación técnica de disolventes para recuperación en columna de rectificación.'
    );

    -- Operación 3: Recogida y Valorización de Papel y Cartón Industrial
    INSERT INTO public.commercial_operations (
        user_id, company_id, numero_operacion, fecha, estado,
        origen_productor_id, origen_center_id, origen_nombre_personalizado, origen_nima, origen_cif,
        destino_gestor_id, destino_nombre_personalizado, destino_nima, destino_cif, destino_autorizacion,
        transportista_id, transportista_nombre_personalizado, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, peligrosidad, operacion_rd,
        cantidad_estimada_t, cantidad_real_t, identification_document_id, numero_albaran_gestor,
        proveedor_comercial_id, proveedor_razon_social, proveedor_cif, tipo_precio_compra, precio_unitario_compra, coste_compra_total, factura_compra_ref, estado_pago_compra,
        cliente_comercial_id, cliente_razon_social, cliente_cif, tipo_precio_venta, precio_unitario_venta, ingreso_venta_total, factura_venta_ref, estado_cobro_venta,
        coste_transporte, otros_costes, descripcion_otros_costes, margen_bruto_total, margen_unitario_tonelada, porcentaje_margen, observaciones
    ) VALUES (
        v_user_id, v_company_id, 'OP-2026-0003', '2026-06-02', 'liquidada',
        v_company_id, v_center_central_id, 'EcoGestión 360 (Planta Central)', '2800012345-01', 'B88997766',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 'B83445566', 'G-MD-2021/3321',
        v_comp_trans_express_id, 'Logística Ecológica Express S.L.', 'B86991122', '1204-MBD',
        '15 01 01', 'Balas de cartón ondulado limpio', 'no-peligroso', 'R03',
        4.000, 4.350, v_di_7, 'ALB-CARTON-2026-09',
        v_company_id, 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', 'por_tonelada', 30.00, 130.50, 'FAC-COMP-INTERNA-06', 'no_aplica',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', 'por_tonelada', 115.00, 500.25, 'FAC-VTA-2026-072', 'cobrado',
        160.00, 20.00, 'Pesaje de báscula', 189.75, 43.62, 37.93, 'Venta de subproducto cartón recuperado a fábrica papelera.'
    );

    -- Operación 4: Retirada de RAEEs con Trading Ambiental
    INSERT INTO public.commercial_operations (
        user_id, company_id, numero_operacion, fecha, estado,
        origen_productor_id, origen_center_id, origen_nombre_personalizado, origen_nima, origen_cif,
        destino_gestor_id, destino_nombre_personalizado, destino_nima, destino_cif, destino_autorizacion,
        transportista_id, transportista_nombre_personalizado, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, peligrosidad, operacion_rd,
        cantidad_estimada_t, cantidad_real_t, identification_document_id, numero_albaran_gestor,
        proveedor_comercial_id, proveedor_razon_social, proveedor_cif, tipo_precio_compra, precio_unitario_compra, coste_compra_total, factura_compra_ref, estado_pago_compra,
        cliente_comercial_id, cliente_razon_social, cliente_cif, tipo_precio_venta, precio_unitario_venta, ingreso_venta_total, factura_venta_ref, estado_cobro_venta,
        coste_transporte, otros_costes, descripcion_otros_costes, margen_bruto_total, margen_unitario_tonelada, porcentaje_margen, observaciones
    ) VALUES (
        v_user_id, v_company_id, 'OP-2026-0004', '2026-10-06', 'completada',
        v_company_id, v_center_central_id, 'EcoGestión 360 (Planta Central)', '2800012345-01', 'B88997766',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 'B83445566', 'G-MD-2021/3321',
        v_comp_trans_logistica_id, 'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '16 02 13*', 'Equipos electrónicos industriales con PCB/componentes', 'peligroso', 'R04',
        0.700, 0.720, v_di_13, 'ALB-RAEE-2026-55',
        v_comp_broker_id, 'Iberia Waste Trading & Brokerage S.L.', 'B89445566', 'por_tonelada', 450.00, 324.00, 'FAC-COMP-2026-088', 'pendiente',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', 'por_tonelada', 1250.00, 900.00, 'FAC-VTA-2026-118', 'pendiente',
        220.00, 45.00, 'Certificado de borrado y destrucción de soportes', 311.00, 431.94, 34.56, 'Intermediación especializada de RAEEs con recuperación de metales preciosos.'
    );

    -- Operación 5: En Tránsito de Virutas de Mecanizado
    INSERT INTO public.commercial_operations (
        user_id, company_id, numero_operacion, fecha, estado,
        origen_productor_id, origen_center_id, origen_nombre_personalizado, origen_nima, origen_cif,
        destino_gestor_id, destino_nombre_personalizado, destino_nima, destino_cif, destino_autorizacion,
        transportista_id, transportista_nombre_personalizado, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, peligrosidad, operacion_rd,
        cantidad_estimada_t, cantidad_real_t, identification_document_id,
        proveedor_comercial_id, proveedor_razon_social, proveedor_cif, tipo_precio_compra, precio_unitario_compra, coste_compra_total, estado_pago_compra,
        cliente_comercial_id, cliente_razon_social, cliente_cif, tipo_precio_venta, precio_unitario_venta, ingreso_venta_total, estado_cobro_venta,
        coste_transporte, otros_costes, margen_bruto_total, margen_unitario_tonelada, porcentaje_margen, observaciones
    ) VALUES (
        v_user_id, v_company_id, 'OP-2026-0005', '2026-10-15', 'en_transito',
        v_comp_automocion_id, NULL, 'Automoción y Componentes del Jarama S.A.', '2800091122', 'A28991122',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 'B83445566', 'G-MD-2021/3321',
        v_comp_trans_norte_id, 'Ecotrans Norte Contenedores y Cubas S.L.', 'B87112233', '7741-JWB',
        '12 01 01', 'Virutas de mecanizado de acero al cromo', 'no-peligroso', 'R04',
        14.000, 0, NULL,
        v_comp_automocion_id, 'Automoción y Componentes del Jarama S.A.', 'A28991122', 'por_tonelada', 140.00, 1960.00, 'pendiente',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', 'por_tonelada', 280.00, 3920.00, 'pendiente',
        450.00, 0, 1510.00, 107.86, 38.52, 'Carga en tránsito. Pendiente de ticket de báscula en fundición de destino.'
    );

    -- Operación 6: Negociación de Plásticos de Inyección (Abierta)
    INSERT INTO public.commercial_operations (
        user_id, company_id, numero_operacion, fecha, estado,
        origen_productor_id, origen_center_id, origen_nombre_personalizado, origen_nima, origen_cif,
        destino_gestor_id, destino_nombre_personalizado, destino_nima, destino_cif, destino_autorizacion,
        transportista_id, transportista_nombre_personalizado, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, peligrosidad, operacion_rd,
        cantidad_estimada_t, cantidad_real_t,
        proveedor_comercial_id, proveedor_razon_social, proveedor_cif, tipo_precio_compra, precio_unitario_compra, coste_compra_total, estado_pago_compra,
        cliente_comercial_id, cliente_razon_social, cliente_cif, tipo_precio_venta, precio_unitario_venta, ingreso_venta_total, estado_cobro_venta,
        coste_transporte, otros_costes, margen_bruto_total, margen_unitario_tonelada, porcentaje_margen, observaciones
    ) VALUES (
        v_user_id, v_company_id, 'OP-2026-0006', '2026-10-17', 'abierta',
        v_comp_automocion_id, NULL, 'Automoción y Componentes del Jarama S.A.', '2800091122', 'A28991122',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 'B83445566', 'G-MD-2021/3321',
        v_comp_trans_express_id, 'Logística Ecológica Express S.L.', 'B86991122', '1204-MBD',
        '15 01 02', 'Plástico técnico de inyección PP/PA', 'no-peligroso', 'R03',
        7.500, 0,
        v_comp_automocion_id, 'Automoción y Componentes del Jarama S.A.', 'A28991122', 'por_tonelada', 110.00, 825.00, 'pendiente',
        v_comp_gestor_reciclajes_id, 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', 'por_tonelada', 320.00, 2400.00, 'pendiente',
        280.00, 30.00, 1265.00, 168.67, 52.71, 'Presupuesto acordado para retirada semanal recurrente.'
    );

    -- ==========================================================================
    -- 12. ENVÍOS TELEMÁTICOS A PLATAFORMA SIRA (public.sira_submissions)
    -- ==========================================================================
    DELETE FROM public.sira_submissions WHERE user_id = v_user_id;

    INSERT INTO public.sira_submissions (
        user_id, company_id, identification_document_id, tipo_envio, estado,
        xml_enviado, xml_respuesta, codigo_acuse, mensaje_error, intentos, created_at, updated_at
    ) VALUES
    (
        v_user_id, v_company_id, v_di_1, 'di', 'aceptado',
        '<?xml version="1.0" encoding="ISO-8859-1"?><e3l:envioDI xmlns:e3l="http://www.e3l.es/e3l"><e3l:documentoIdentificacion id="DI-2026-0001"><e3l:productor nima="2800012345-01"/><e3l:gestor nima="2800045678"/><e3l:residuo ler="130205*" cantidad="1250"/></e3l:documentoIdentificacion></e3l:envioDI>',
        '<?xml version="1.0" encoding="ISO-8859-1"?><e3l:respuestaSIRA><e3l:estado>ACEPTADO</e3l:estado><e3l:codigoRegistro>SIRA-REG-2026-0091823</e3l:codigoRegistro><e3l:fechaRecepcion>2026-02-04T11:42:10Z</e3l:fechaRecepcion></e3l:respuestaSIRA>',
        'SIRA-REG-2026-0091823', NULL, 1, '2026-02-04 11:42:10+01', '2026-02-04 11:42:10+01'
    ),
    (
        v_user_id, v_company_id, v_di_2, 'di', 'aceptado',
        '<?xml version="1.0" encoding="ISO-8859-1"?><e3l:envioDI xmlns:e3l="http://www.e3l.es/e3l"><e3l:documentoIdentificacion id="DI-2026-0002"><e3l:productor nima="2800012345-01"/><e3l:gestor nima="2800078901"/><e3l:residuo ler="140603*" cantidad="600"/></e3l:documentoIdentificacion></e3l:envioDI>',
        '<?xml version="1.0" encoding="ISO-8859-1"?><e3l:respuestaSIRA><e3l:estado>ACEPTADO</e3l:estado><e3l:codigoRegistro>SIRA-REG-2026-0112498</e3l:codigoRegistro></e3l:respuestaSIRA>',
        'SIRA-REG-2026-0112498', NULL, 1, '2026-02-18 16:15:32+01', '2026-02-18 16:15:32+01'
    ),
    (
        v_user_id, v_company_id, v_di_3, 'di', 'aceptado',
        '<?xml version="1.0" encoding="ISO-8859-1"?><e3l:envioDI xmlns:e3l="http://www.e3l.es/e3l"><e3l:documentoIdentificacion id="DI-2026-0003"><e3l:productor nima="2800012345-02"/><e3l:gestor nima="2800045678"/><e3l:residuo ler="150110*" cantidad="480"/></e3l:documentoIdentificacion></e3l:envioDI>',
        '<?xml version="1.0" encoding="ISO-8859-1"?><e3l:respuestaSIRA><e3l:estado>ACEPTADO</e3l:estado><e3l:codigoRegistro>SIRA-REG-2026-0145892</e3l:codigoRegistro></e3l:respuestaSIRA>',
        'SIRA-REG-2026-0145892', NULL, 1, '2026-03-05 10:20:05+01', '2026-03-05 10:20:05+01'
    ),
    (
        v_user_id, v_company_id, v_di_11, 'di', 'pendiente',
        '<?xml version="1.0" encoding="ISO-8859-1"?><e3l:envioDI xmlns:e3l="http://www.e3l.es/e3l"><e3l:documentoIdentificacion id="DI-2026-0011"><e3l:productor nima="2800012345-01"/><e3l:gestor nima="2800088772"/><e3l:residuo ler="200108" cantidad="1950"/></e3l:documentoIdentificacion></e3l:envioDI>',
        NULL, NULL, 'Pendiente de confirmación telemática del pesaje por gestor destinatario.', 1, '2026-09-18 09:30:00+02', '2026-09-18 09:30:00+02'
    );

    -- ==========================================================================
    -- 13. PISTA DE AUDITORÍA Y TRAZABILIDAD (public.audit_logs - 10 REGISTROS)
    -- ==========================================================================
    DELETE FROM public.audit_logs WHERE user_id = v_user_id;

    INSERT INTO public.audit_logs (
        user_id, company_id, entidad, entidad_id, accion, detalles, ip_address, created_at
    ) VALUES
    (v_user_id, v_company_id, 'empresa', v_company_id::text, 'crear', '{"mensaje":"Creación de empresa titular EcoGestión 360 con NIMA 2800012345"}'::jsonb, '192.168.1.100', '2026-01-10 09:15:00+01'),
    (v_user_id, v_company_id, 'contrato', v_contract_aceites_id::text, 'crear', '{"numero_contrato":"CTR-2026/001-VAL","gestor":"Tratamientos Ibéricos"}'::jsonb, '192.168.1.100', '2026-01-10 10:22:15+01'),
    (v_user_id, v_company_id, 'di', v_di_1::text, 'crear', '{"numero_documento":"DI-2026-0001","ler":"130205*","cantidad_kg":1250}'::jsonb, '192.168.1.100', '2026-02-04 08:30:00+01'),
    (v_user_id, v_company_id, 'integracion_sira', v_di_1::text, 'sincronizar_sira', '{"registro_acuse":"SIRA-REG-2026-0091823","resultado":"aceptado"}'::jsonb, '192.168.1.100', '2026-02-04 11:42:10+01'),
    (v_user_id, v_company_id, 'di', v_di_1::text, 'cambiar_estado', '{"estado_anterior":"borrador","estado_nuevo":"completado"}'::jsonb, '192.168.1.100', '2026-02-04 12:00:00+01'),
    (v_user_id, v_company_id, 'archivo_cronologico', 'AS-2026-0003', 'crear', '{"asiento":"AS-2026-0003","tipo":"salida_traslado","ler":"130205*"}'::jsonb, '192.168.1.100', '2026-02-04 12:05:00+01'),
    (v_user_id, v_company_id, 'operacion_comercial', 'OP-2026-0001', 'crear', '{"operacion":"OP-2026-0001","margen_previsto":660.00}'::jsonb, '192.168.1.105', '2026-07-16 14:10:00+02'),
    (v_user_id, v_company_id, 'operacion_comercial', 'OP-2026-0001', 'recepcionar_pesada', '{"peso_bruto_t":24.50,"tara_t":15.78,"neto_t":8.72}'::jsonb, '192.168.1.105', '2026-07-16 16:45:00+02'),
    (v_user_id, v_company_id, 'memoria_anual', '2025', 'exportar_archivo', '{"anio":2025,"total_t":74.85,"formato":"EXCEL_SIRA"}'::jsonb, '192.168.1.100', '2026-02-24 10:15:00+01'),
    (v_user_id, v_company_id, 'integracion_holded', v_company_id::text, 'sincronizar_holded', '{"contactos_sincronizados":8,"facturas_vinculadas":4}'::jsonb, '192.168.1.100', '2026-08-01 09:00:00+02');

    -- ==========================================================================
    -- 14. AUTORIZACIONES AMBIENTALES (public.environmental_authorizations)
    -- ==========================================================================
    DELETE FROM public.environmental_authorizations WHERE user_id = v_user_id;

    INSERT INTO public.environmental_authorizations (
        user_id, company_id, production_center_id, numero_autorizacion,
        titulo, organismo_emisor, fecha_emision, fecha_vencimiento,
        es_indefinida, notas, activo
    ) VALUES
    (
        v_user_id, v_company_id, v_center_central_id,
        'AAI-28/2021-0498',
        'Autorización Ambiental Integrada (AAI) - Complejo Industrial y Mezclado',
        'Consejería de Medio Ambiente, Agricultura e Interior - Comunidad de Madrid',
        '2021-05-18', '2029-05-17', false,
        'Autorización para procesos de formulación química, mezclado, almacenamiento temporal e I+D con informe anual PRTR.',
        true
    ),
    (
        v_user_id, v_company_id, v_center_central_id,
        'P-2800012345-RP',
        'Inscripción de Gran Productor de Residuos Peligrosos (>10 t/año)',
        'Dirección General de Transición Ecológica y Economía Circular',
        '2020-03-10', NULL, true,
        'NIMA 2800012345 con plan de minimización quinquenal en vigor.',
        true
    ),
    (
        v_user_id, v_company_id, v_center_sur_id,
        'GES-MD-2024/0215',
        'Autorización de Gestor: Almacenamiento Temporal R13 y D15',
        'Comunidad de Madrid - Área de Calidad Ambiental',
        '2024-01-15', '2029-01-14', false,
        'Habilita solera hormigonada y cubetas de retención con capacidad de 150 m³.',
        true
    ),
    (
        v_user_id, v_company_id, NULL,
        'TRA-MD-2023/0890',
        'Inscripción en el Registro de Transportistas de Residuos Profesionales',
        'Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO)',
        '2023-04-12', NULL, true,
        'Válida para todo el territorio nacional según RD 553/2020 y acuerdos ADR.',
        true
    );

    -- ==========================================================================
    -- 15. MEMORIAS ANUALES (public.annual_reports y public.annual_report_lines)
    -- ==========================================================================
    DELETE FROM public.annual_reports WHERE user_id = v_user_id;

    -- Memoria 2025 (Presentada en SIRA)
    INSERT INTO public.annual_reports (
        user_id, company_id, anio, tipo_memoria, fecha_inicio, fecha_fin, estado,
        total_residuos_generados, total_residuos_gestionados, unidad,
        fecha_presentacion, numero_registro_sira, sira_presentado, notas
    ) VALUES (
        v_user_id, v_company_id, 2025, 'productor',
        '2025-01-01', '2025-12-31', 'presentada',
        74.850, 74.850, 'toneladas',
        '2026-02-24', 'SIRA-2026-REG-09941', true,
        'Memoria anual 2025 validada telemáticamente por la Consejería de Medio Ambiente.'
    ) RETURNING id INTO v_report_2025_id;

    INSERT INTO public.annual_report_lines (
        annual_report_id, codigo_ler, descripcion_residuo,
        origen_razon_social, origen_nima, destino_razon_social, destino_nima,
        cantidad_total, unidad, numero_operaciones, operacion_tratamiento
    ) VALUES
    (v_report_2025_id, '13 02 05*', 'Aceites minerales no clorados de motor', 'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678', 5.420, 'toneladas', 5, 'R09'),
    (v_report_2025_id, '14 06 03*', 'Otros disolventes y mezclas', 'EcoGestión 360', '2800012345', 'Regeneración de Disolventes del Jarama S.L.', '2800078901', 3.150, 'toneladas', 4, 'R02'),
    (v_report_2025_id, '15 01 10*', 'Envases con restos peligrosos', 'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678', 2.280, 'toneladas', 4, 'R04'),
    (v_report_2025_id, '15 01 01', 'Envases de papel y cartón', 'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 24.800, 'toneladas', 6, 'R03'),
    (v_report_2025_id, '17 04 05', 'Hierro y acero', 'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 39.200, 'toneladas', 4, 'R04');

    -- Memoria 2026 (Borrador en curso acumulado en tiempo real)
    INSERT INTO public.annual_reports (
        user_id, company_id, anio, tipo_memoria, fecha_inicio, fecha_fin, estado,
        total_residuos_generados, total_residuos_gestionados, unidad,
        fecha_presentacion, numero_registro_sira, sira_presentado, notas
    ) VALUES (
        v_user_id, v_company_id, 2026, 'productor',
        '2026-01-01', '2026-12-31', 'borrador',
        29.970, 29.970, 'toneladas',
        NULL, NULL, false,
        'Borrador automático calculado desde el Archivo Cronológico y DIs del ejercicio 2026.'
    ) RETURNING id INTO v_report_2026_id;

    INSERT INTO public.annual_report_lines (
        annual_report_id, codigo_ler, descripcion_residuo,
        origen_razon_social, origen_nima, destino_razon_social, destino_nima,
        cantidad_total, unidad, numero_operaciones, operacion_tratamiento
    ) VALUES
    (v_report_2026_id, '13 02 05*', 'Aceites minerales no clorados de motor', 'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678', 1.250, 'toneladas', 1, 'R09'),
    (v_report_2026_id, '14 06 03*', 'Otros disolventes y mezclas', 'EcoGestión 360', '2800012345', 'Regeneración de Disolventes del Jarama S.L.', '2800078901', 0.600, 'toneladas', 1, 'R02'),
    (v_report_2026_id, '15 01 10*', 'Envases con restos peligrosos', 'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678', 0.480, 'toneladas', 1, 'R04'),
    (v_report_2026_id, '15 02 02*', 'Trapos y absorbentes contaminados', 'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678', 0.340, 'toneladas', 1, 'D10'),
    (v_report_2026_id, '08 01 11*', 'Residuos de pintura y barniz', 'EcoGestión 360', '2800012345', 'Regeneración de Disolventes del Jarama S.L.', '2800078901', 0.520, 'toneladas', 1, 'D09'),
    (v_report_2026_id, '16 01 07*', 'Filtros de aceite', 'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678', 0.290, 'toneladas', 1, 'R04'),
    (v_report_2026_id, '15 01 01', 'Envases de papel y cartón', 'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 4.350, 'toneladas', 1, 'R03'),
    (v_report_2026_id, '15 01 02', 'Envases de plástico', 'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 2.900, 'toneladas', 1, 'R03'),
    (v_report_2026_id, '17 04 05', 'Hierro y acero', 'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 8.720, 'toneladas', 1, 'R04'),
    (v_report_2026_id, '12 01 01', 'Limaduras y virutas férreas', 'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 3.200, 'toneladas', 1, 'R04'),
    (v_report_2026_id, '16 06 01*', 'Baterías de plomo', 'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678', 0.850, 'toneladas', 1, 'R04'),
    (v_report_2026_id, '16 02 13*', 'Equipos desechados RAEE', 'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881', 0.720, 'toneladas', 1, 'R04');

    -- ==========================================================================
    -- 16. PROYECTO CARTOGRÁFICO Y GEODATOS GIS (projects, map_collections, spatial_data)
    -- ==========================================================================
    -- Limpiar completamente las tablas GIS para eliminar datos obsoletos o residuales
    BEGIN
        DELETE FROM public.spatial_data;
        DELETE FROM public.map_collections;
        DELETE FROM public.projects;
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Nota al limpiar tablas GIS: %', SQLERRM;
    END;

    INSERT INTO public.projects (name, description, user_id)
    VALUES (
        'Red Logística y Centros Ambientales - Resigest 360',
        'Mapa interactivo de la infraestructura operativa: plantas propias, centros de transferencia autorizados y gestores finales de tratamiento en la Comunidad de Madrid.',
        v_user_id
    ) RETURNING id INTO v_project_id;

    -- Colección 1: Centros Propios de Producción y Transferencia
    INSERT INTO public.map_collections (project_id, name, description, user_id)
    VALUES (
        v_project_id,
        'Centros e Instalaciones Propias EcoGestión',
        'Ubicaciones de sedes de fabricación, almacenamiento R13/D15 y valorización',
        v_user_id
    ) RETURNING id INTO v_collection_centros_id;

    -- Colección 2: Plantas de Gestores Finales
    INSERT INTO public.map_collections (project_id, name, description, user_id)
    VALUES (
        v_project_id,
        'Plantas Gestoras de Destino Final',
        'Instalaciones autorizadas para regeneración R09/R02, reciclaje de metales R04 y compostaje R03',
        v_user_id
    ) RETURNING id INTO v_collection_gestores_id;

    -- Puntos GIS en spatial_data (si la tabla está disponible)
    BEGIN
        INSERT INTO public.spatial_data (
            collection_id, name, description, category, geometry_type, geometry,
            latitude, longitude, address, user_id
        ) VALUES
        (
            v_collection_centros_id,
            'Planta Central Madrid (Las Mercedes)',
            'Sede principal, líneas de formulación y taller mecánico. NIMA 2800012345-01.',
            'Planta Propia', 'point',
            '{"type": "Point", "coordinates": [-3.5855, 40.4435]}'::jsonb,
            40.4435, -3.5855, 'C/ Campezo 14, 28022 Madrid', v_user_id
        ),
        (
            v_collection_centros_id,
            'Centro Logístico y Transferencia Sur (Fuenlabrada)',
            'Almacenamiento temporal R13 y D15 con solera estanca. NIMA 2800012345-02.',
            'Planta Propia', 'point',
            '{"type": "Point", "coordinates": [-3.7431, 40.2684]}'::jsonb,
            40.2684, -3.7431, 'C/ Manuel Cobo Calleja 52, 28947 Fuenlabrada, Madrid', v_user_id
        ),
        (
            v_collection_centros_id,
            'Planta de Valorización del Corredor (Alcalá)',
            'Clasificación y prensado de film plástico y cartón. NIMA 2800012345-03.',
            'Planta Propia', 'point',
            '{"type": "Point", "coordinates": [-3.3592, 40.4852]}'::jsonb,
            40.4852, -3.3592, 'Vía Complutense 120, 28805 Alcalá de Henares, Madrid', v_user_id
        ),
        (
            v_collection_gestores_id,
            'Tratamientos y Valorizaciones Ibéricas S.A. (Alcobendas)',
            'Gestor autorizado G-MD-2022/9901 para regeneración de aceites R09 e incineración D10.',
            'Gestor Destino', 'point',
            '{"type": "Point", "coordinates": [-3.6428, 40.5367]}'::jsonb,
            40.5367, -3.6428, 'Avda. de la Industria 45, 28108 Alcobendas, Madrid', v_user_id
        ),
        (
            v_collection_gestores_id,
            'Regeneración de Disolventes del Jarama S.L. (San Fernando)',
            'Planta de destilación fraccionada y recuperación R02 de disolventes.',
            'Gestor Destino', 'point',
            '{"type": "Point", "coordinates": [-3.5350, 40.4281]}'::jsonb,
            40.4281, -3.5350, 'C/ Sierra de Guadarrama 8, 28830 San Fernando de Henares, Madrid', v_user_id
        ),
        (
            v_collection_gestores_id,
            'Planta Integral de Reciclaje y Metales S.L. (Getafe)',
            'Parque de chatarra, fragmentación y valorización de metales férreos y RAEEs.',
            'Gestor Destino', 'point',
            '{"type": "Point", "coordinates": [-3.7082, 40.3129]}'::jsonb,
            40.3129, -3.7082, 'C/ Carpinteros 19, 28906 Getafe, Madrid', v_user_id
        ),
        (
            v_collection_gestores_id,
            'Centro Ambiental de Compostaje del Tajo (Aranjuez)',
            'Túneles de compostaje biológico aerobio R03 para fracción orgánica.',
            'Gestor Destino', 'point',
            '{"type": "Point", "coordinates": [-3.6021, 40.0315]}'::jsonb,
            40.0315, -3.6021, 'Carretera de Toledo km 18, 28300 Aranjuez, Madrid', v_user_id
        );
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE 'Nota: spatial_data no insertado o no requerido: %', SQLERRM;
    END;

    RAISE NOTICE '===================================================================';
    RAISE NOTICE 'SEED COMPLETO RESIGEST 360 FINALIZADO CON ÉXITO:';
    RAISE NOTICE '1. Usuario Demo: demo@resigest.com (Clave: DemoResigest2026!)';
    RAISE NOTICE '2. Empresa Propia: EcoGestión 360 (ID: %) con credenciales SIRA/Holded', v_company_id;
    RAISE NOTICE '3. Empresas Colaboradoras: 5 creadas (Productores, Negociantes, Agentes)';
    RAISE NOTICE '4. Centros de Producción: 3 instalaciones creadas';
    RAISE NOTICE '5. Transportistas Registrados: 4 empresas con matrículas y autorizaciones';
    RAISE NOTICE '6. Gestores de Tratamiento: 4 gestores con códigos R/D asignados';
    RAISE NOTICE '7. Contratos de Tratamiento: 4 contratos RD 553/2020';
    RAISE NOTICE '8. Documentos de Identificación (DIs): 14 registros con variados estados';
    RAISE NOTICE '9. Archivo Cronológico (Art. 64 Ley 7/2022): 26 asientos con códigos HP';
    RAISE NOTICE '10. Operaciones Comerciales: 6 operaciones con costes, ventas y margen';
    RAISE NOTICE '11. Envíos Telemáticos SIRA: 4 envíos con payloads XML y acuses';
    RAISE NOTICE '12. Pista de Auditoría: 10 registros inmutables';
    RAISE NOTICE '13. Autorizaciones Ambientales: 4 títulos habilitantes activos';
    RAISE NOTICE '14. Memorias Anuales: 2 ejercicios (2025 presentada + 2026 borrador)';
    RAISE NOTICE '15. Proyecto GIS: 1 proyecto cartográfico con 7 ubicaciones geográficas';
    RAISE NOTICE '===================================================================';
END $$;
