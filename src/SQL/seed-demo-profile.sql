-- ==============================================================================
-- RESIGEST 360 - SEED DATA: PERFIL DE PRUEBA Y DEMOSTRACIÓN COMPLETO
-- ==============================================================================
-- Este script crea o actualiza un perfil de prueba ("demo@resigest.com") con un
-- ecosistema exhaustivo de datos para demostración y evaluación de la plataforma:
--
-- 1. Usuario y Perfil (auth.users + public.profiles):
--    - Email: demo@resigest.com
--    - Contraseña: DemoResigest2026!
--    - Nombre: Demo Resigest 360
-- 2. Empresa Principal ("is_my_company = true"):
--    - EcoGestión y Soluciones Ambientales 360, S.L. (Productor / Gestor / Transportista)
-- 3. Centros de Producción (3 instalaciones operativas)
-- 4. Transportistas Autorizados (4 empresas de logística ambiental con matrículas y NIMA)
-- 5. Gestores de Tratamiento Autorizados (4 gestores finales con códigos R/D y autorizaciones)
-- 6. Contratos de Tratamiento (RD 553/2020) con gestores
-- 7. Documentos de Identificación - DIs (12 DIs con residuos peligrosos y no peligrosos)
-- 8. Archivo Cronológico (Art. 64 Ley 7/2022) con 22 asientos correlativos y códigos HP
-- 9. Autorizaciones Ambientales (AAI, Productor, Transportista, Almacenamiento)
-- 10. Memorias Anuales (2025 presentada con SIRA + 2026 en curso) con desglose de líneas
--
-- INSTRUCCIONES DE EJECUCIÓN:
-- 1. Accede al Dashboard de Supabase -> SQL Editor:
--    https://supabase.com/dashboard/project/wdjwlzsvgvnrveycebhk/sql
-- 2. Pega y ejecuta este script completo.
-- 3. Inicia sesión en la plataforma con:
--    - Correo: demo@resigest.com
--    - Contraseña: DemoResigest2026!
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id UUID;
    v_company_id BIGINT;
    v_center_central_id BIGINT;
    v_center_sur_id BIGINT;
    v_center_corredor_id BIGINT;
    
    -- IDs de Gestores
    v_gestor_ibericas_id BIGINT;
    v_gestor_jarama_id BIGINT;
    v_gestor_reciclajes_id BIGINT;
    v_gestor_tajo_id BIGINT;
    
    -- IDs de Transportistas
    v_trans_logistica_id BIGINT;
    v_trans_adr_id BIGINT;
    v_trans_express_id BIGINT;
    v_trans_norte_id BIGINT;
    
    -- IDs de Contratos
    v_contract_aceites_id BIGINT;
    v_contract_disolventes_id BIGINT;
    v_contract_metales_id BIGINT;
    v_contract_organicos_id BIGINT;
    
    -- IDs de Documentos de Identificación
    v_di_1 BIGINT; v_di_2 BIGINT; v_di_3 BIGINT; v_di_4 BIGINT;
    v_di_5 BIGINT; v_di_6 BIGINT; v_di_7 BIGINT; v_di_8 BIGINT;
    v_di_9 BIGINT; v_di_10 BIGINT; v_di_11 BIGINT; v_di_12 BIGINT;
    
    -- ID Memoria Anual
    v_report_2025_id BIGINT;
    v_report_2026_id BIGINT;
BEGIN
    -- ==========================================================================
    -- 1. CREACIÓN O CONFIRMACIÓN DEL USUARIO DEMO EN AUTH.USERS
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
            confirmed_at,
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
            confirmed_at = COALESCE(confirmed_at, NOW()),
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
        id,
        email,
        first_name,
        last_name,
        bio,
        phone,
        location,
        created_at,
        updated_at
    ) VALUES (
        v_user_id,
        'demo@resigest.com',
        'Demo',
        'Resigest 360',
        'Perfil corporativo de demostración oficial con catálogo integral de residuos peligrosos y no peligrosos, trazabilidad completa documental según RD 553/2020 y Archivo Cronológico digital obligatorio según Ley 7/2022.',
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
    -- 3. EMPRESA PRINCIPAL (is_my_company = true)
    -- ==========================================================================
    -- Si ya existía una empresa principal del demo, la recuperamos o la actualizamos
    SELECT id INTO v_company_id 
    FROM public.companies 
    WHERE user_id = v_user_id AND is_my_company = true 
    LIMIT 1;

    IF v_company_id IS NULL THEN
        INSERT INTO public.companies (
            user_id,
            razon_social,
            nombre_comercial,
            cif,
            nima,
            numero_inscripcion,
            domicilio_social,
            codigo_postal_social,
            municipio_social,
            provincia_social,
            domicilio_instalacion,
            codigo_postal_instalacion,
            municipio_instalacion,
            provincia_instalacion,
            telefono,
            email,
            persona_contacto,
            tipo_empresa,
            roles,
            is_my_company,
            numero_autorizacion,
            matricula,
            activo,
            notas
        ) VALUES (
            v_user_id,
            'EcoGestión y Soluciones Ambientales 360, S.L.',
            'EcoGestión 360',
            'B88997766',
            '2800012345',
            'INS-MD-2022-88771',
            'Polígono Industrial Las Mercedes, C/ Campezo 14, Nave 3',
            '28022',
            'Madrid',
            'Madrid',
            'Polígono Industrial Cobo Calleja, C/ Manuel Cobo Calleja 52',
            '28947',
            'Fuenlabrada',
            'Madrid',
            '+34 910 123 456',
            'operaciones@ecogestion360.es',
            'Elena Ramos Navarro (Dpto. Medio Ambiente)',
            'productor',
            ARRAY['productor', 'gestor', 'transportista'],
            true,
            'G-MD-2024/0215',
            '3421-KLR',
            true,
            'Empresa de demostración con actividad productiva, almacenamiento temporal y flota propia de transporte de residuos no peligrosos.'
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
            roles = ARRAY['productor', 'gestor', 'transportista'],
            is_my_company = true,
            numero_autorizacion = 'G-MD-2024/0215',
            matricula = '3421-KLR',
            activo = true
        WHERE id = v_company_id;
    END IF;

    -- ==========================================================================
    -- 4. CENTROS DE PRODUCCIÓN (public.production_centers)
    -- ==========================================================================
    DELETE FROM public.production_centers WHERE company_id = v_company_id;

    INSERT INTO public.production_centers (
        company_id, user_id, nombre, direccion, nima, descripcion, activo
    ) VALUES (
        v_company_id,
        v_user_id,
        'Planta Central Madrid (Fabricación, Mezclado y Envasado)',
        'Polígono Industrial Las Mercedes, C/ Campezo 14, 28022 Madrid',
        '2800012345-01',
        'Sede principal con líneas de proceso químico, envasado y taller de mantenimiento general.',
        true
    ) RETURNING id INTO v_center_central_id;

    INSERT INTO public.production_centers (
        company_id, user_id, nombre, direccion, nima, descripcion, activo
    ) VALUES (
        v_company_id,
        v_user_id,
        'Centro Logístico y Transferencia Sur (Fuenlabrada)',
        'Polígono Industrial Cobo Calleja, C/ Manuel Cobo Calleja 52, 28947 Fuenlabrada, Madrid',
        '2800012345-02',
        'Instalación de consolidación, almacenamiento temporal de residuos R13/D15 y lavado de flota.',
        true
    ) RETURNING id INTO v_center_sur_id;

    INSERT INTO public.production_centers (
        company_id, user_id, nombre, direccion, nima, descripcion, activo
    ) VALUES (
        v_company_id,
        v_user_id,
        'Planta de Valorización y Reciclaje del Corredor (Alcalá de Henares)',
        'Vía Complutense 120, 28805 Alcalá de Henares, Madrid',
        '2800012345-03',
        'Centro técnico de clasificación de envases, trituración mecánica y recuperación de materiales.',
        true
    ) RETURNING id INTO v_center_corredor_id;

    -- ==========================================================================
    -- 5. TRANSPORTISTAS REGISTRADOS (public.carriers)
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
        'Flota especializada en camiones portacontenedores basculantes y camiones pulpo para chatarras y residuos sólidos.'
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
        'Cisternas calorifugadas de acero inoxidable y furgones con trampilla elevadora autorizados para mercancías peligrosas ADR.'
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
    -- 6. GESTORES DE TRATAMIENTO AUTORIZADOS (public.treatment_managers)
    -- ==========================================================================
    DELETE FROM public.treatment_managers WHERE user_id = v_user_id;

    INSERT INTO public.treatment_managers (
        user_id, razon_social, cif, nima, numero_autorizacion,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Tratamientos y Valorizaciones Ibéricas S.A.',
        'A28112233',
        '2800045678',
        'G-MD-2022/9901',
        'Avda. de la Industria 45, Pol. Ind. Alcobendas',
        '28108', 'Alcobendas', 'Madrid',
        '+34 914 901 200', 'planta@tratamientosibericos.es',
        'Ing. Marcos Vidal (Director Técnico)',
        true,
        'Instalación polivalente de tratamiento físico-químico D09, regeneración de aceites R09 e incineración controlada D10.'
    ) RETURNING id INTO v_gestor_ibericas_id;

    INSERT INTO public.treatment_managers (
        user_id, razon_social, cif, nima, numero_autorizacion,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Regeneración de Disolventes del Jarama S.L.',
        'B82334455',
        '2800078901',
        'G-MD-2020/4412',
        'C/ Sierra de Guadarrama 8, Pol. Ind. San Fernando',
        '28830', 'San Fernando de Henares', 'Madrid',
        '+34 916 712 345', 'laboratorio@disolventesjarama.es',
        'Dra. Lucía Menéndez',
        true,
        'Planta química autorizada para destilación fraccionada y recuperación de disolventes halogenados y no halogenados (operación R02).'
    ) RETURNING id INTO v_gestor_jarama_id;

    INSERT INTO public.treatment_managers (
        user_id, razon_social, cif, nima, numero_autorizacion,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Planta Integral de Reciclaje y Metales S.L.',
        'B83445566',
        '2800099881',
        'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19',
        '28906', 'Getafe', 'Madrid',
        '+34 916 830 011', 'pesaje@reciclajesmetales.es',
        'Santiago Fuentes',
        true,
        'Centro autorizado de valorización R04 de chatarras férreas, metales nobles, RAEEs y corte por cizalla/oxicorte.'
    ) RETURNING id INTO v_gestor_reciclajes_id;

    INSERT INTO public.treatment_managers (
        user_id, razon_social, cif, nima, numero_autorizacion,
        direccion, codigo_postal, municipio, provincia, telefono, email,
        persona_contacto, activo, notas
    ) VALUES 
    (
        v_user_id,
        'Centro Ambiental de Compostaje y Biomasa del Tajo S.L.',
        'B88332211',
        '2800088772',
        'G-MD-2023/5510',
        'Carretera de Toledo km 18, Finca Soto del Tajo',
        '28300', 'Aranjuez', 'Madrid',
        '+34 918 921 543', 'compost@ambientaltajo.es',
        'María Ángeles Gil',
        true,
        'Planta de biometanización, digestión anaerobia y compostaje controlado R03 para fracción orgánica y restos vegetales.'
    ) RETURNING id INTO v_gestor_tajo_id;

    -- ==========================================================================
    -- 7. CONTRATOS DE TRATAMIENTO DE RESIDUOS (public.waste_contracts)
    -- ==========================================================================
    DELETE FROM public.waste_contracts WHERE user_id = v_user_id;

    INSERT INTO public.waste_contracts (
        user_id, company_id, treatment_manager_id, numero_contrato,
        fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
        descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual,
        unidad_cantidad, precio_unitario, moneda, estado, notas
    ) VALUES 
    (
        v_user_id,
        v_company_id,
        v_gestor_ibericas_id,
        'CTR-2026/001-VAL',
        '2026-01-10', '2026-01-15', '2027-01-14',
        'tratamiento',
        'Aceites minerales usados (130205*), absorbentes y trapos contaminados (150202*), filtros de aceite (160107*) y envases contaminados (150110*).',
        ARRAY['R09', 'R04', 'D09', 'D10'],
        65.00, 'toneladas', 185.00, 'EUR',
        'vigente',
        'Contrato principal de valorización y tratamiento conforme al RD 553/2020 con aceptación previa de los residuos peligrosos.'
    ) RETURNING id INTO v_contract_aceites_id;

    INSERT INTO public.waste_contracts (
        user_id, company_id, treatment_manager_id, numero_contrato,
        fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
        descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual,
        unidad_cantidad, precio_unitario, moneda, estado, notas
    ) VALUES 
    (
        v_user_id,
        v_company_id,
        v_gestor_jarama_id,
        'CTR-2026/002-DIS',
        '2026-01-12', '2026-02-01', '2027-01-31',
        'tratamiento',
        'Disolventes orgánicos no halogenados (140603*), residuos de pintura con base disolvente (080111*) y disolventes de limpieza.',
        ARRAY['R02', 'D09'],
        35.00, 'toneladas', 310.00, 'EUR',
        'vigente',
        'Regeneración de disolventes mediante columnas de rectificación para reintroducción en el ciclo productivo (economía circular).'
    ) RETURNING id INTO v_contract_disolventes_id;

    INSERT INTO public.waste_contracts (
        user_id, company_id, treatment_manager_id, numero_contrato,
        fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
        descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual,
        unidad_cantidad, precio_unitario, moneda, estado, notas
    ) VALUES 
    (
        v_user_id,
        v_company_id,
        v_gestor_reciclajes_id,
        'CTR-2026/003-MET',
        '2026-01-08', '2026-01-10', '2028-01-09',
        'valoracion',
        'Chatarra de hierro y acero (170405), virutas de metales férreos (120101), embalajes de papel y cartón (150101) y envases plásticos (150102).',
        ARRAY['R03', 'R04'],
        180.00, 'toneladas', 90.00, 'EUR',
        'vigente',
        'Acuerdo marco de compraventa y valorización de materiales reciclables limpios con compensación según cotización del mercado.'
    ) RETURNING id INTO v_contract_metales_id;

    INSERT INTO public.waste_contracts (
        user_id, company_id, treatment_manager_id, numero_contrato,
        fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
        descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual,
        unidad_cantidad, precio_unitario, moneda, estado, notas
    ) VALUES 
    (
        v_user_id,
        v_company_id,
        v_gestor_tajo_id,
        'CTR-2026/004-BIO',
        '2026-02-01', '2026-02-15', '2027-02-14',
        'valoracion',
        'Residuos biodegradables de comedores (200108) y restos vegetales de mantenimiento de zonas verdes (020103).',
        ARRAY['R03'],
        45.00, 'toneladas', 65.00, 'EUR',
        'vigente',
        'Compostaje en túnel cerrado con obtención de compost clase A con certificación ecológica.'
    ) RETURNING id INTO v_contract_organicos_id;

    -- ==========================================================================
    -- 8. DOCUMENTOS DE IDENTIFICACIÓN (public.identification_documents - DIs)
    -- ==========================================================================
    DELETE FROM public.identification_documents WHERE user_id = v_user_id;

    -- DI 1: Aceite mineral de motor (Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0001', '2026-02-04',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '13 02 05*', 'Aceites minerales no clorados de motor, de transmisión mecánica y de lubricación',
        'liquido', 'peligroso', 1250.000, 'kg', 1, 'Contenedor GRG 1000L homologado UN',
        'R09', 'Regeneración de aceites usados', '2026-02-04', '2026-02-04',
        true, true, true, '2026-02-04', '2026-02-04', '2026-02-04',
        'completado', 'Retirada trimestral de aceites de mantenimiento de motores y reductores mecánicos.'
    ) RETURNING id INTO v_di_1;

    -- DI 2: Disolventes orgánicos (Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_disolventes_id, 'DI-2026-0002', '2026-02-18',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Regeneración de Disolventes del Jarama S.L.', 'B82334455', '2800078901', 'G-MD-2020/4412',
        'C/ Sierra de Guadarrama 8', '28830', 'San Fernando de Henares', 'Madrid',
        'Transportes Especiales ADR Circulares S.A.', 'A84112299', '8932-KMN',
        '14 06 03*', 'Otros disolventes y mezclas de disolventes',
        'liquido', 'peligroso', 600.000, 'kg', 3, 'Bidones de acero homologados 200L',
        'R02', 'Recuperación o regeneración de disolventes', '2026-02-18', '2026-02-18',
        true, true, true, '2026-02-18', '2026-02-18', '2026-02-18',
        'completado', 'Transporte amparado por carta de porte ADR clase 3 con panel naranja.'
    ) RETURNING id INTO v_di_2;

    -- DI 3: Envases contaminados (Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0003', '2026-03-05',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-02',
        'C/ Manuel Cobo Calleja 52', '28947', 'Fuenlabrada', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '15 01 10*', 'Envases que contienen restos de sustancias peligrosas o están contaminados por ellas',
        'solido', 'peligroso', 480.000, 'kg', 2, 'Big-Bags impermeables 1m³ con liner interior',
        'R04', 'Reciclado o recuperación de metales y compuestos metálicos', '2026-03-05', '2026-03-05',
        true, true, true, '2026-03-05', '2026-03-05', '2026-03-05',
        'completado', 'Latas vacías de lubricantes, adhesivos y botes de pintura escurridos.'
    ) RETURNING id INTO v_di_3;

    -- DI 4: Absorbentes y trapos de limpieza (Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0004', '2026-03-24',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '15 02 02*', 'Absorbentes, materiales de filtración, trapos de limpieza y ropas protectoras contaminados',
        'solido', 'peligroso', 340.000, 'kg', 2, 'Contenedores rodantes estancos 240L',
        'D10', 'Incineración en tierra', '2026-03-24', '2026-03-24',
        true, true, true, '2026-03-24', '2026-03-24', '2026-03-24',
        'completado', 'Trapos y sepiolita usados en el taller mecánico y líneas de envasado.'
    ) RETURNING id INTO v_di_4;

    -- DI 5: Pinturas y barnices con disolventes (Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_disolventes_id, 'DI-2026-0005', '2026-04-10',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Regeneración de Disolventes del Jarama S.L.', 'B82334455', '2800078901', 'G-MD-2020/4412',
        'C/ Sierra de Guadarrama 8', '28830', 'San Fernando de Henares', 'Madrid',
        'Transportes Especiales ADR Circulares S.A.', 'A84112299', '8932-KMN',
        '08 01 11*', 'Residuos de pintura y barniz que contienen disolventes orgánicos u otras sustancias peligrosas',
        'pastoso', 'peligroso', 520.000, 'kg', 2, 'Bidones de apertura total con fleje 200L',
        'D09', 'Tratamiento físico-químico', '2026-04-10', '2026-04-10',
        true, true, true, '2026-04-10', '2026-04-10', '2026-04-10',
        'completado', 'Fondos de cubas de pintura y purgas de cabinas de aplicación.'
    ) RETURNING id INTO v_di_5;

    -- DI 6: Filtros de aceite (Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0006', '2026-05-14',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-02',
        'C/ Manuel Cobo Calleja 52', '28947', 'Fuenlabrada', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '16 01 07*', 'Filtros de aceite',
        'solido', 'peligroso', 290.000, 'kg', 1, 'Bidón metálico de acero 200L',
        'R04', 'Reciclado de metales férreos y desclasificación', '2026-05-14', '2026-05-14',
        true, true, true, '2026-05-14', '2026-05-14', '2026-05-14',
        'completado', 'Filtros de aceite prensados procedentes de flota propia y maquinaria de planta.'
    ) RETURNING id INTO v_di_6;

    -- DI 7: Papel y Cartón (No Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0007', '2026-06-02',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'Logística Ecológica Express S.L.', 'B86991122', '1204-MBD',
        '15 01 01', 'Envases de papel y cartón',
        'solido', 'no-peligroso', 4350.000, 'kg', 8, 'Balas compactadas flejadas de alta densidad',
        'R03', 'Reciclado o recuperación de sustancias orgánicas', '2026-06-02', '2026-06-02',
        true, true, true, '2026-06-02', '2026-06-02', '2026-06-02',
        'completado', 'Embalajes limpios de cartón ondulado procedentes de despaletizado de materias primas.'
    ) RETURNING id INTO v_di_7;

    -- DI 8: Plásticos industriales (No Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0008', '2026-06-25',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-03',
        'Vía Complutense 120', '28805', 'Alcalá de Henares', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'Logística Ecológica Express S.L.', 'B86991122', '1204-MBD',
        '15 01 02', 'Envases de plástico',
        'solido', 'no-peligroso', 2900.000, 'kg', 5, 'Balas prensadas de film polietileno PEBD',
        'R03', 'Reciclado mecánico y granza de plástico', '2026-06-25', '2026-06-25',
        true, true, true, '2026-06-25', '2026-06-25', '2026-06-25',
        'completado', 'Film retráctil y flejes de polipropileno clasificados en planta.'
    ) RETURNING id INTO v_di_8;

    -- DI 9: Hierro y Acero (No Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0009', '2026-07-16',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-02',
        'C/ Manuel Cobo Calleja 52', '28947', 'Fuenlabrada', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'Ecotrans Norte Contenedores y Cubas S.L.', 'B87112233', '7741-JWB',
        '17 04 05', 'Hierro y acero',
        'solido', 'no-peligroso', 8720.000, 'kg', 1, 'Contenedor abierto basculante 30m³',
        'R04', 'Reciclado o recuperación de metales y compuestos metálicos', '2026-07-16', '2026-07-16',
        true, true, true, '2026-07-16', '2026-07-16', '2026-07-16',
        'completado', 'Estructuras metálicas desmanteladas y tuberías de acero al carbono.'
    ) RETURNING id INTO v_di_9;

    -- DI 10: Virutas de metales férreos (No Peligroso)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_metales_id, 'DI-2026-0010', '2026-08-05',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'Polígono Los Ángeles, C/ Carpinteros 19', '28906', 'Getafe', 'Madrid',
        'Ecotrans Norte Contenedores y Cubas S.L.', 'B87112233', '7741-JWB',
        '12 01 01', 'Limaduras y virutas de metales férreos',
        'solido', 'no-peligroso', 3200.000, 'kg', 2, 'Contenedores metálicos estancos 1500L',
        'R04', 'Reciclado y fundición de viruta de mecanizado', '2026-08-05', '2026-08-05',
        true, true, true, '2026-08-05', '2026-08-05', '2026-08-05',
        'completado', 'Viruta limpia de tornos y centros de mecanizado CNC sin taladrina residual.'
    ) RETURNING id INTO v_di_10;

    -- DI 11: Residuos orgánicos compostables (No Peligroso - Pendiente de Firma)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        fecha_firma_productor, fecha_firma_gestor, fecha_firma_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_organicos_id, 'DI-2026-0011', '2026-09-18',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Centro Ambiental de Compostaje y Biomasa del Tajo S.L.', 'B88332211', '2800088772', 'G-MD-2023/5510',
        'Carretera de Toledo km 18', '28300', 'Aranjuez', 'Madrid',
        'Logística Ecológica Express S.L.', 'B86991122', '1204-MBD',
        '20 01 08', 'Residuos biodegradables de cocinas y restaurantes',
        'solido', 'no-peligroso', 1950.000, 'kg', 8, 'Contenedores marrones 240L con bolsa compostable',
        'R03', 'Compostaje biológico aerobio', '2026-09-18', NULL,
        true, false, true, '2026-09-18', NULL, '2026-09-18',
        'pendiente-firma', 'En espera de la validación y firma electrónica por el gestor de destino en báscula.'
    ) RETURNING id INTO v_di_11;

    -- DI 12: Aceite mineral de motor (Peligroso - Borrador en preparación)
    INSERT INTO public.identification_documents (
        user_id, company_id, contract_id, numero_documento, fecha_documento,
        tipo_notificacion, productor_razon_social, productor_cif, productor_nima,
        productor_direccion, productor_codigo_postal, productor_municipio, productor_provincia,
        gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion,
        gestor_direccion, gestor_codigo_postal, gestor_municipio, gestor_provincia,
        transportista_razon_social, transportista_cif, transportista_matricula,
        codigo_ler, descripcion_residuo, estado_fisico, peligrosidad,
        cantidad, unidad, numero_envases, tipo_envases,
        operacion_tratamiento, descripcion_tratamiento,
        fecha_recogida, fecha_entrega,
        firmado_productor, firmado_gestor, firmado_transportista,
        estado, notas
    ) VALUES (
        v_user_id, v_company_id, v_contract_aceites_id, 'DI-2026-0012', '2026-10-15',
        'sin-notificacion', 'EcoGestión y Soluciones Ambientales 360, S.L.', 'B88997766', '2800012345-01',
        'C/ Campezo 14', '28022', 'Madrid', 'Madrid',
        'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'Avda. de la Industria 45', '28108', 'Alcobendas', 'Madrid',
        'TransAmbiental Logística Verde S.L.', 'B85667788', '4521-LXZ',
        '13 02 05*', 'Aceites minerales no clorados de motor, de transmisión mecánica y de lubricación',
        'liquido', 'peligroso', 1150.000, 'kg', 1, 'Contenedor GRG 1000L homologado UN',
        'R09', 'Regeneración de aceites usados', NULL, NULL,
        false, false, false,
        'borrador', 'Documento preparado para la próxima retirada programada a finales de mes.'
    ) RETURNING id INTO v_di_12;

    -- ==========================================================================
    -- 9. ARCHIVO CRONOLÓGICO OBLIGATORIO (public.chronological_registry - ART. 64 LEY 7/2022)
    -- ==========================================================================
    DELETE FROM public.chronological_registry WHERE user_id = v_user_id;

    -- Asientos 2026: Generaciones internas, traslados con DI y regularizaciones
    INSERT INTO public.chronological_registry (
        user_id, company_id, production_center_id, numero_asiento, fecha,
        tipo_operacion, codigo_ler, descripcion_residuo, peligrosidad, codigo_hp, estado_fisico,
        cantidad_kg, envase_tipo, envase_unidades, origen_tipo, origen_razon_social, origen_nima,
        transportista_nif, transportista_razon_social, transportista_nima, transportista_matricula,
        destino_tipo, destino_razon_social, destino_nif, destino_nima, destino_autorizacion,
        operacion_rd, operacion_rd_descripcion, identification_document_id, numero_documento_referencia,
        observaciones
    ) VALUES
    -- Asiento 01: Generación Aceites en Planta Central
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0001', '2026-01-20',
        'produccion_interna', '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'peligroso',
        ARRAY['HP5'], 'liquido', 650.000, 'GRG 1000L', 1, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'PARTE-MANT-01/26', 'Purga y cambio de lubricante en bancada de compresión nº 2.'
    ),
    -- Asiento 02: Generación Aceites en Planta Central (segundo tramo)
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0002', '2026-02-02',
        'produccion_interna', '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'peligroso',
        ARRAY['HP5'], 'liquido', 600.000, 'GRG 1000L', 1, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'PARTE-MANT-02/26', 'Llenado completo de GRG de almacenamiento temporal.'
    ),
    -- Asiento 03: Salida Traslado Aceites amparada por DI-2026-0001
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0003', '2026-02-04',
        'salida_traslado', '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'peligroso',
        ARRAY['HP5'], 'liquido', 1250.000, 'GRG 1000L', 1, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01',
        'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ',
        'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'R09', 'Regeneración de aceites usados', v_di_1, 'DI-2026-0001',
        'Entrega realizada a gestor final autorizado. Pesaje verificado en báscula: 1.250 kg.'
    ),
    -- Asiento 04: Generación Disolventes
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0004', '2026-02-15',
        'produccion_interna', '14 06 03*', 'Otros disolventes y mezclas de disolventes', 'peligroso',
        ARRAY['HP3', 'HP4', 'HP6'], 'liquido', 600.000, 'Bidones 200L', 3, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'PROD-QUIM-02/26', 'Enjuague de reactores y limpieza de líneas de trasvase.'
    ),
    -- Asiento 05: Salida Traslado Disolventes amparada por DI-2026-0002
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0005', '2026-02-18',
        'salida_traslado', '14 06 03*', 'Otros disolventes y mezclas de disolventes', 'peligroso',
        ARRAY['HP3', 'HP4', 'HP6'], 'liquido', 600.000, 'Bidones 200L', 3, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01',
        'A84112299', 'Transportes Especiales ADR Circulares S.A.', '2800055443', '8932-KMN',
        'tercero_gestor', 'Regeneración de Disolventes del Jarama S.L.', 'B82334455', '2800078901', 'G-MD-2020/4412',
        'R02', 'Recuperación o regeneración de disolventes', v_di_2, 'DI-2026-0002',
        'Expedición bajo normativa ADR con carta de porte e instrucciones escritas.'
    ),
    -- Asiento 06: Generación Envases Peligrosos en Centro Sur
    (
        v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0006', '2026-02-28',
        'produccion_interna', '15 01 10*', 'Envases que contienen restos de sustancias peligrosas', 'peligroso',
        ARRAY['HP4', 'HP14'], 'solido', 480.000, 'Big-Bag 1m³', 2, 'propio',
        'EcoGestión 360 (Centro Sur)', '2800012345-02', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'ALMACEN-SUR-02/26', 'Acumulación de envases metálicos y plásticos vacíos escurridos.'
    ),
    -- Asiento 07: Salida Traslado Envases Peligrosos amparada por DI-2026-0003
    (
        v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0007', '2026-03-05',
        'salida_traslado', '15 01 10*', 'Envases que contienen restos de sustancias peligrosas', 'peligroso',
        ARRAY['HP4', 'HP14'], 'solido', 480.000, 'Big-Bag 1m³', 2, 'propio',
        'EcoGestión 360 (Centro Sur)', '2800012345-02',
        'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ',
        'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'R04', 'Reciclado o recuperación de metales', v_di_3, 'DI-2026-0003',
        'Envío para lavado, descontaminación y triturado mecánico.'
    ),
    -- Asiento 08: Generación Trapos y Absorbentes
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0008', '2026-03-20',
        'produccion_interna', '15 02 02*', 'Absorbentes, materiales de filtración y trapos contaminados', 'peligroso',
        ARRAY['HP5'], 'solido', 340.000, 'Contenedores 240L', 2, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'TALLER-MANT-03/26', 'Material absorbente utilizado en recogida de pequeños derrames de mantenimiento.'
    ),
    -- Asiento 09: Salida Traslado Trapos amparada por DI-2026-0004
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0009', '2026-03-24',
        'salida_traslado', '15 02 02*', 'Absorbentes, materiales de filtración y trapos contaminados', 'peligroso',
        ARRAY['HP5'], 'solido', 340.000, 'Contenedores 240L', 2, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01',
        'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ',
        'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'D10', 'Incineración en tierra con recuperación energética', v_di_4, 'DI-2026-0004',
        'Valorización energética R01/D10 en horno rotatorio de alta temperatura.'
    ),
    -- Asiento 10: Generación Pinturas
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0010', '2026-04-05',
        'produccion_interna', '08 01 11*', 'Residuos de pintura y barniz con disolventes orgánicos', 'peligroso',
        ARRAY['HP3', 'HP5'], 'pastoso', 520.000, 'Bidones 200L', 2, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'CABINA-PINT-04/26', 'Limpieza general de cubas y toberas de la cabina de recubrimiento epoxi.'
    ),
    -- Asiento 11: Salida Traslado Pinturas amparada por DI-2026-0005
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0011', '2026-04-10',
        'salida_traslado', '08 01 11*', 'Residuos de pintura y barniz con disolventes orgánicos', 'peligroso',
        ARRAY['HP3', 'HP5'], 'pastoso', 520.000, 'Bidones 200L', 2, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01',
        'A84112299', 'Transportes Especiales ADR Circulares S.A.', '2800055443', '8932-KMN',
        'tercero_gestor', 'Regeneración de Disolventes del Jarama S.L.', 'B82334455', '2800078901', 'G-MD-2020/4412',
        'D09', 'Tratamiento físico-químico', v_di_5, 'DI-2026-0005',
        'Tratamiento de solidificación e inertización físico-química.'
    ),
    -- Asiento 12: Generación Filtros de Aceite Centro Sur
    (
        v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0012', '2026-05-10',
        'produccion_interna', '16 01 07*', 'Filtros de aceite', 'peligroso',
        ARRAY['HP5'], 'solido', 290.000, 'Bidón 200L', 1, 'propio',
        'EcoGestión 360 (Centro Sur)', '2800012345-02', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'MANT-FLOTA-05/26', 'Revisión y mantenimiento semestral de cabezas tractoras y maquinaria.'
    ),
    -- Asiento 13: Salida Traslado Filtros amparada por DI-2026-0006
    (
        v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0013', '2026-05-14',
        'salida_traslado', '16 01 07*', 'Filtros de aceite', 'peligroso',
        ARRAY['HP5'], 'solido', 290.000, 'Bidón 200L', 1, 'propio',
        'EcoGestión 360 (Centro Sur)', '2800012345-02',
        'B85667788', 'TransAmbiental Logística Verde S.L.', '2800033221', '4521-LXZ',
        'tercero_gestor', 'Tratamientos y Valorizaciones Ibéricas S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901',
        'R04', 'Reciclado de metales férreos', v_di_6, 'DI-2026-0006',
        'Drenaje forzado por centrifugación y separación de chapa férrea.'
    ),
    -- Asiento 14: Generación Papel y Cartón en Planta Central
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0014', '2026-05-30',
        'produccion_interna', '15 01 01', 'Envases de papel y cartón', 'no-peligroso',
        NULL, 'solido', 4350.000, 'Balas prensadas', 8, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'EMBALAJE-05/26', 'Prensado en prensa horizontal automática de cajas y embalajes de recepción.'
    ),
    -- Asiento 15: Salida Traslado Papel y Cartón amparada por DI-2026-0007
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0015', '2026-06-02',
        'salida_traslado', '15 01 01', 'Envases de papel y cartón', 'no-peligroso',
        NULL, 'solido', 4350.000, 'Balas prensadas', 8, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01',
        'B86991122', 'Logística Ecológica Express S.L.', '2800066778', '1204-MBD',
        'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'R03', 'Reciclado o recuperación de sustancias orgánicas', v_di_7, 'DI-2026-0007',
        'Carga completa de camión con destino papelera de reciclaje.'
    ),
    -- Asiento 16: Generación Plásticos en Planta Corredor
    (
        v_user_id, v_company_id, v_center_corredor_id, 'AS-2026-0016', '2026-06-20',
        'produccion_interna', '15 01 02', 'Envases de plástico', 'no-peligroso',
        NULL, 'solido', 2900.000, 'Balas prensadas', 5, 'propio',
        'EcoGestión 360 (Planta Corredor)', '2800012345-03', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'RECICLAJE-06/26', 'Clasificación de film de polietileno y flejes de paletizado.'
    ),
    -- Asiento 17: Salida Traslado Plásticos amparada por DI-2026-0008
    (
        v_user_id, v_company_id, v_center_corredor_id, 'AS-2026-0017', '2026-06-25',
        'salida_traslado', '15 01 02', 'Envases de plástico', 'no-peligroso',
        NULL, 'solido', 2900.000, 'Balas prensadas', 5, 'propio',
        'EcoGestión 360 (Planta Corredor)', '2800012345-03',
        'B86991122', 'Logística Ecológica Express S.L.', '2800066778', '1204-MBD',
        'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'R03', 'Reciclado mecánico y granza', v_di_8, 'DI-2026-0008',
        'Salida valorizable de polietileno transparente de alta pureza.'
    ),
    -- Asiento 18: Generación Chatarra de Hierro y Acero Centro Sur
    (
        v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0018', '2026-07-10',
        'produccion_interna', '17 04 05', 'Hierro y acero', 'no-peligroso',
        NULL, 'solido', 8720.000, 'Cuba 30m³', 1, 'propio',
        'EcoGestión 360 (Centro Sur)', '2800012345-02', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'OBRA-REFORMA-07/26', 'Desmantelamiento de pasarelas y sustitución de perfiles estructurales.'
    ),
    -- Asiento 19: Salida Traslado Chatarra amparada por DI-2026-0009
    (
        v_user_id, v_company_id, v_center_sur_id, 'AS-2026-0019', '2026-07-16',
        'salida_traslado', '17 04 05', 'Hierro y acero', 'no-peligroso',
        NULL, 'solido', 8720.000, 'Cuba 30m³', 1, 'propio',
        'EcoGestión 360 (Centro Sur)', '2800012345-02',
        'B87112233', 'Ecotrans Norte Contenedores y Cubas S.L.', '2800077889', '7741-JWB',
        'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'R04', 'Reciclado de metales en acería', v_di_9, 'DI-2026-0009',
        'Ticket de pesaje gestor nº 88412 con tara y bruto certificados.'
    ),
    -- Asiento 20: Generación Virutas Metálicas Planta Central
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0020', '2026-07-31',
        'produccion_interna', '12 01 01', 'Limaduras y virutas de metales férreos', 'no-peligroso',
        NULL, 'solido', 3200.000, 'Contenedores 1500L', 2, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'MECANIZADO-07/26', 'Mecanizado de piezas de repuesto y valvulería industrial.'
    ),
    -- Asiento 21: Salida Traslado Virutas amparada por DI-2026-0010
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0021', '2026-08-05',
        'salida_traslado', '12 01 01', 'Limaduras y virutas de metales férreos', 'no-peligroso',
        NULL, 'solido', 3200.000, 'Contenedores 1500L', 2, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01',
        'B87112233', 'Ecotrans Norte Contenedores y Cubas S.L.', '2800077889', '7741-JWB',
        'tercero_gestor', 'Planta Integral de Reciclaje y Metales S.L.', 'B83445566', '2800099881', 'G-MD-2021/3321',
        'R04', 'Reciclado y fundición de viruta', v_di_10, 'DI-2026-0010',
        'Entrega directa en fundición colaboradora autorizada.'
    ),
    -- Asiento 22: Ajuste de Regularización de Inventario (Merma)
    (
        v_user_id, v_company_id, v_center_central_id, 'AS-2026-0022', '2026-09-30',
        'merma_ajuste', '14 06 03*', 'Otros disolventes y mezclas de disolventes', 'peligroso',
        ARRAY['HP3'], 'liquido', 15.000, 'Bidón 200L', 1, 'propio',
        'EcoGestión 360 (Planta Central)', '2800012345-01', NULL, NULL, NULL, NULL,
        'propio_tratamiento', NULL, NULL, NULL, NULL,
        NULL, NULL, NULL, 'INV-TRIMESTRAL-Q3', 'Ajuste justificado por evaporación natural en cubeta de retención ventilada.'
    );

    -- ==========================================================================
    -- 10. AUTORIZACIONES AMBIENTALES (public.environmental_authorizations)
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
        'Autorización Ambiental Integrada (AAI) - Instalación Química y Tratamiento',
        'Consejería de Medio Ambiente, Agricultura e Interior - Comunidad de Madrid',
        '2021-05-18', '2029-05-17', false,
        'Autorización para actividades de formulación, mezclado, almacenamiento temporal e I+D con informe anual de emisiones PRTR.',
        true
    ),
    (
        v_user_id, v_company_id, v_center_central_id,
        'P-2800012345-RP',
        'Inscripción de Gran Productor de Residuos Peligrosos (>10 t/año)',
        'Dirección General de Transición Ecológica y Economía Circular',
        '2020-03-10', NULL, true,
        'Número de registro NIMA 2800012345 con plan de minimización quinquenal aprobado.',
        true
    ),
    (
        v_user_id, v_company_id, v_center_sur_id,
        'GES-MD-2024/0215',
        'Autorización de Gestor de Residuos: Almacenamiento Temporal R13 y D15',
        'Comunidad de Madrid - Área de Residuos Peligrosos',
        '2024-01-15', '2029-01-14', false,
        'Habilita el acopio técnico en solera hormigonada estanca y cubetas de retención con capacidad de 150 m³.',
        true
    ),
    (
        v_user_id, v_company_id, NULL,
        'TRA-MD-2023/0890',
        'Inscripción en el Registro de Transportistas de Residuos Profesionales con Asunción de Titularidad',
        'Ministerio para la Transición Ecológica y el Reto Demográfico (MITECO)',
        '2023-04-12', NULL, true,
        'Válida para todo el territorio nacional con cumplimiento del RD 553/2020 y acuerdos ADR de mercancías peligrosas.',
        true
    );

    -- ==========================================================================
    -- 11. MEMORIAS ANUALES (public.annual_reports y public.annual_report_lines)
    -- ==========================================================================
    DELETE FROM public.annual_reports WHERE user_id = v_user_id;

    -- Memoria Anual 2025: Presentada en SIRA
    INSERT INTO public.annual_reports (
        user_id, company_id, anio, tipo_memoria,
        fecha_inicio, fecha_fin, estado,
        total_residuos_generados, total_residuos_gestionados, unidad,
        fecha_presentacion, numero_registro_sira, sira_presentado,
        notas
    ) VALUES (
        v_user_id, v_company_id, 2025, 'productor',
        '2025-01-01', '2025-12-31', 'presentado',
        74.850, 74.850, 'toneladas',
        '2026-02-24', 'SIRA-2026-REG-09941', true,
        'Declaración anual de productor de residuos 2025 validada telemáticamente por la Consejería de Medio Ambiente.'
    ) RETURNING id INTO v_report_2025_id;

    -- Líneas de la Memoria Anual 2025
    INSERT INTO public.annual_report_lines (
        annual_report_id, codigo_ler, descripcion_residuo,
        origen_razon_social, origen_nima, destino_razon_social, destino_nima,
        cantidad_total, unidad, numero_operaciones, operacion_tratamiento
    ) VALUES
    (
        v_report_2025_id, '13 02 05*', 'Aceites minerales no clorados de motor y lubricación',
        'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678',
        5.420, 'toneladas', 5, 'R09'
    ),
    (
        v_report_2025_id, '14 06 03*', 'Otros disolventes y mezclas de disolventes',
        'EcoGestión 360', '2800012345', 'Regeneración de Disolventes del Jarama S.L.', '2800078901',
        3.150, 'toneladas', 4, 'R02'
    ),
    (
        v_report_2025_id, '15 01 10*', 'Envases que contienen restos de sustancias peligrosas',
        'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678',
        2.280, 'toneladas', 4, 'R04'
    ),
    (
        v_report_2025_id, '15 01 01', 'Envases de papel y cartón',
        'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881',
        24.800, 'toneladas', 6, 'R03'
    ),
    (
        v_report_2025_id, '17 04 05', 'Hierro y acero',
        'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881',
        39.200, 'toneladas', 4, 'R04'
    );

    -- Memoria Anual 2026: En curso (Borrador acumulado)
    INSERT INTO public.annual_reports (
        user_id, company_id, anio, tipo_memoria,
        fecha_inicio, fecha_fin, estado,
        total_residuos_generados, total_residuos_gestionados, unidad,
        fecha_presentacion, numero_registro_sira, sira_presentado,
        notas
    ) VALUES (
        v_user_id, v_company_id, 2026, 'productor',
        '2026-01-01', '2026-12-31', 'borrador',
        27.400, 27.400, 'toneladas',
        NULL, NULL, false,
        'Borrador automático en tiempo real generado desde los DIs y el Archivo Cronológico del ejercicio 2026.'
    ) RETURNING id INTO v_report_2026_id;

    -- Líneas acumuladas de la Memoria 2026
    INSERT INTO public.annual_report_lines (
        annual_report_id, codigo_ler, descripcion_residuo,
        origen_razon_social, origen_nima, destino_razon_social, destino_nima,
        cantidad_total, unidad, numero_operaciones, operacion_tratamiento
    ) VALUES
    (
        v_report_2026_id, '13 02 05*', 'Aceites minerales no clorados de motor y lubricación',
        'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678',
        1.250, 'toneladas', 1, 'R09'
    ),
    (
        v_report_2026_id, '14 06 03*', 'Otros disolventes y mezclas de disolventes',
        'EcoGestión 360', '2800012345', 'Regeneración de Disolventes del Jarama S.L.', '2800078901',
        0.600, 'toneladas', 1, 'R02'
    ),
    (
        v_report_2026_id, '15 01 10*', 'Envases que contienen restos de sustancias peligrosas',
        'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678',
        0.480, 'toneladas', 1, 'R04'
    ),
    (
        v_report_2026_id, '15 02 02*', 'Absorbentes y trapos de limpieza contaminados',
        'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678',
        0.340, 'toneladas', 1, 'D10'
    ),
    (
        v_report_2026_id, '08 01 11*', 'Residuos de pintura y barniz con disolventes',
        'EcoGestión 360', '2800012345', 'Regeneración de Disolventes del Jarama S.L.', '2800078901',
        0.520, 'toneladas', 1, 'D09'
    ),
    (
        v_report_2026_id, '16 01 07*', 'Filtros de aceite',
        'EcoGestión 360', '2800012345', 'Tratamientos y Valorizaciones Ibéricas S.A.', '2800045678',
        0.290, 'toneladas', 1, 'R04'
    ),
    (
        v_report_2026_id, '15 01 01', 'Envases de papel y cartón',
        'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881',
        4.350, 'toneladas', 1, 'R03'
    ),
    (
        v_report_2026_id, '15 01 02', 'Envases de plástico',
        'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881',
        2.900, 'toneladas', 1, 'R03'
    ),
    (
        v_report_2026_id, '17 04 05', 'Hierro y acero',
        'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881',
        8.720, 'toneladas', 1, 'R04'
    ),
    (
        v_report_2026_id, '12 01 01', 'Limaduras y virutas de metales férreos',
        'EcoGestión 360', '2800012345', 'Planta Integral de Reciclaje y Metales S.L.', '2800099881',
        3.200, 'toneladas', 1, 'R04'
    );

    RAISE NOTICE '===================================================================';
    RAISE NOTICE 'SEED DEMO COMPLETADO CON ÉXITO:';
    RAISE NOTICE 'Usuario Demo: demo@resigest.com (Clave: DemoResigest2026!)';
    RAISE NOTICE 'Empresa: EcoGestión y Soluciones Ambientales 360, S.L. (ID: %)', v_company_id;
    RAISE NOTICE 'Centros de Producción: 3 creados';
    RAISE NOTICE 'Transportistas: 4 creados';
    RAISE NOTICE 'Gestores de Tratamiento: 4 creados';
    RAISE NOTICE 'Contratos de Tratamiento: 4 vigentes creados';
    RAISE NOTICE 'Documentos de Identificación (DIs): 12 creados';
    RAISE NOTICE 'Asientos de Archivo Cronológico: 22 registros creados';
    RAISE NOTICE 'Autorizaciones Ambientales: 4 registros creados';
    RAISE NOTICE 'Memorias Anuales: 2 ejercicios (2025 presentada + 2026 borrador)';
    RAISE NOTICE '===================================================================';
END $$;
