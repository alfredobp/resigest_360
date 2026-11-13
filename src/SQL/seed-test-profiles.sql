-- ==============================================================================
-- RESIGEST 360 - SEED IDEMPOTENTE DE CUENTAS DE PRUEBA INDEPENDIENTES
-- ==============================================================================
-- Crea 6 usuarios normales independientes (role = 'user', SIN privilegios admin)
-- para validar permisos reales, dashboards adaptados, onboarding, consultoría
-- y aislamiento del módulo de Negociante:
--
--   BLOQUE 1:
--   1) productor.prueba@resigest.test     -> Industrias Metálicas del Sur S.L. (Productor)
--   2) gestor.prueba@resigest.test        -> Chatarrería y Recuperaciones Toledo S.L. (Chatarrería/Gestor)
--   3) transportista.prueba@resigest.test -> TransLogística Ambiental Express S.L. (Transportista)
--   4) nuevo.prueba@resigest.test         -> Cuenta limpia SIN empresa (probar /onboarding desde cero)
--
--   BLOQUE 2:
--   5) consultor.prueba@metodoambiental.test -> Método Ambiental Consultoría S.L. (Consultor multi-empresa)
--   6) negociante.prueba@resigest.test       -> Iberia Waste Trading S.L. (Negociante aislado)
--
-- Contraseña común de pruebas: ResigestTest2026!
-- (Usada también por /api/demo/signin cuando ENABLE_DEMO_ACCESS=true)
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
  v_pass TEXT := 'ResigestTest2026!';

  -- IDs de usuarios
  v_uid_productor UUID := '11111111-1111-4111-8111-111111111101'::uuid;
  v_uid_gestor UUID := '22222222-2222-4222-8222-222222222202'::uuid;
  v_uid_transportista UUID := '33333333-3333-4333-8333-333333333303'::uuid;
  v_uid_nuevo UUID := '44444444-4444-4444-8444-444444444404'::uuid;
  v_uid_consultor UUID := '55555555-5555-4555-8555-555555555505'::uuid;
  v_uid_negociante UUID := '66666666-6666-4666-8666-666666666606'::uuid;

  -- Empresas propias
  v_comp_prod_id BIGINT;
  v_comp_prod_gestor_id BIGINT;
  v_center_prod_id BIGINT;
  v_tm_prod_id BIGINT;
  v_ctr_prod_id BIGINT;
  v_di_p1 BIGINT; v_di_p2 BIGINT; v_di_p3 BIGINT; v_di_p4 BIGINT;

  v_comp_gestor_id BIGINT;
  v_comp_gestor_aceria_id BIGINT;
  v_center_gestor_id BIGINT;
  v_di_g1 BIGINT; v_di_g2 BIGINT;

  v_comp_trans_id BIGINT;
  v_di_t1 BIGINT; v_di_t2 BIGINT;

  v_comp_consultor_id BIGINT;

  v_comp_neg_id BIGINT;
  v_comp_neg_prov_id BIGINT;
  v_comp_neg_cli_id BIGINT;
BEGIN
  -- ============================================================================
  -- HELPER INLINE: UPSERT DE LOS 6 USUARIOS EN AUTH.USERS Y PUBLIC.PROFILES
  -- ============================================================================

  -- 1. PRODUCTOR
  SELECT id INTO v_uid_productor FROM auth.users WHERE email = 'productor.prueba@resigest.test' LIMIT 1;
  IF v_uid_productor IS NULL THEN
    v_uid_productor := '11111111-1111-4111-8111-111111111101'::uuid;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_uid_productor, '00000000-0000-0000-0000-000000000000'::uuid, 'productor.prueba@resigest.test', crypt(v_pass, gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Carlos","last_name":"Productor Prueba"}'::jsonb, NOW(), NOW());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_pass, gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, NOW()), updated_at = NOW() WHERE id = v_uid_productor;
  END IF;
  INSERT INTO public.profiles (id, email, first_name, last_name, role, location, created_at, updated_at)
  VALUES (v_uid_productor, 'productor.prueba@resigest.test', 'Carlos', 'Productor Prueba', 'user', 'Sevilla, España', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'user', first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = NOW();

  -- 2. GESTOR / CHATARRERIA
  SELECT id INTO v_uid_gestor FROM auth.users WHERE email = 'gestor.prueba@resigest.test' LIMIT 1;
  IF v_uid_gestor IS NULL THEN
    v_uid_gestor := '22222222-2222-4222-8222-222222222202'::uuid;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_uid_gestor, '00000000-0000-0000-0000-000000000000'::uuid, 'gestor.prueba@resigest.test', crypt(v_pass, gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Laura","last_name":"Gestor Chatarrería"}'::jsonb, NOW(), NOW());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_pass, gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, NOW()), updated_at = NOW() WHERE id = v_uid_gestor;
  END IF;
  INSERT INTO public.profiles (id, email, first_name, last_name, role, location, created_at, updated_at)
  VALUES (v_uid_gestor, 'gestor.prueba@resigest.test', 'Laura', 'Gestor Chatarrería', 'user', 'Toledo, España', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'user', first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = NOW();

  -- 3. TRANSPORTISTA
  SELECT id INTO v_uid_transportista FROM auth.users WHERE email = 'transportista.prueba@resigest.test' LIMIT 1;
  IF v_uid_transportista IS NULL THEN
    v_uid_transportista := '33333333-3333-4333-8333-333333333303'::uuid;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_uid_transportista, '00000000-0000-0000-0000-000000000000'::uuid, 'transportista.prueba@resigest.test', crypt(v_pass, gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Miguel","last_name":"Transportista Ruta"}'::jsonb, NOW(), NOW());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_pass, gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, NOW()), updated_at = NOW() WHERE id = v_uid_transportista;
  END IF;
  INSERT INTO public.profiles (id, email, first_name, last_name, role, location, created_at, updated_at)
  VALUES (v_uid_transportista, 'transportista.prueba@resigest.test', 'Miguel', 'Transportista Ruta', 'user', 'Madrid, España', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'user', first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = NOW();

  -- 4. CLIENTE NUEVO (SIN EMPRESA)
  SELECT id INTO v_uid_nuevo FROM auth.users WHERE email = 'nuevo.prueba@resigest.test' LIMIT 1;
  IF v_uid_nuevo IS NULL THEN
    v_uid_nuevo := '44444444-4444-4444-8444-444444444404'::uuid;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_uid_nuevo, '00000000-0000-0000-0000-000000000000'::uuid, 'nuevo.prueba@resigest.test', crypt(v_pass, gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Nuevo","last_name":"Cliente Sin Configurar"}'::jsonb, NOW(), NOW());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_pass, gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, NOW()), updated_at = NOW() WHERE id = v_uid_nuevo;
  END IF;
  INSERT INTO public.profiles (id, email, first_name, last_name, role, location, created_at, updated_at)
  VALUES (v_uid_nuevo, 'nuevo.prueba@resigest.test', 'Nuevo', 'Cliente Sin Configurar', 'user', 'España', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'user', first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = NOW();

  -- Limpiar cualquier empresa creada durante pruebas previas para el usuario nuevo
  DELETE FROM public.companies WHERE user_id = v_uid_nuevo;

  -- 5. CONSULTOR MÉTODO AMBIENTAL
  SELECT id INTO v_uid_consultor FROM auth.users WHERE email = 'consultor.prueba@metodoambiental.test' LIMIT 1;
  IF v_uid_consultor IS NULL THEN
    v_uid_consultor := '55555555-5555-4555-8555-555555555505'::uuid;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_uid_consultor, '00000000-0000-0000-0000-000000000000'::uuid, 'consultor.prueba@metodoambiental.test', crypt(v_pass, gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Elena","last_name":"Consultora Método Ambiental"}'::jsonb, NOW(), NOW());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_pass, gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, NOW()), updated_at = NOW() WHERE id = v_uid_consultor;
  END IF;
  INSERT INTO public.profiles (id, email, first_name, last_name, role, location, created_at, updated_at)
  VALUES (v_uid_consultor, 'consultor.prueba@metodoambiental.test', 'Elena', 'Consultora Método Ambiental', 'user', 'Sevilla, España', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'user', first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = NOW();

  -- 6. NEGOCIANTE AISLADO
  SELECT id INTO v_uid_negociante FROM auth.users WHERE email = 'negociante.prueba@resigest.test' LIMIT 1;
  IF v_uid_negociante IS NULL THEN
    v_uid_negociante := '66666666-6666-4666-8666-666666666606'::uuid;
    INSERT INTO auth.users (id, instance_id, email, encrypted_password, email_confirmed_at, role, aud, raw_app_meta_data, raw_user_meta_data, created_at, updated_at)
    VALUES (v_uid_negociante, '00000000-0000-0000-0000-000000000000'::uuid, 'negociante.prueba@resigest.test', crypt(v_pass, gen_salt('bf')), NOW(), 'authenticated', 'authenticated', '{"provider":"email","providers":["email"]}'::jsonb, '{"first_name":"Gonzalo","last_name":"Negociante Comercial"}'::jsonb, NOW(), NOW());
  ELSE
    UPDATE auth.users SET encrypted_password = crypt(v_pass, gen_salt('bf')), email_confirmed_at = COALESCE(email_confirmed_at, NOW()), updated_at = NOW() WHERE id = v_uid_negociante;
  END IF;
  INSERT INTO public.profiles (id, email, first_name, last_name, role, location, created_at, updated_at)
  VALUES (v_uid_negociante, 'negociante.prueba@resigest.test', 'Gonzalo', 'Negociante Comercial', 'user', 'Madrid, España', NOW(), NOW())
  ON CONFLICT (id) DO UPDATE SET role = 'user', first_name = EXCLUDED.first_name, last_name = EXCLUDED.last_name, updated_at = NOW();

  -- ============================================================================
  -- DATA 1: PRODUCTOR INDEPENDIENTE (Industrias Metálicas del Sur S.L.)
  -- ============================================================================
  DELETE FROM public.chronological_registry WHERE user_id = v_uid_productor;
  DELETE FROM public.identification_documents WHERE user_id = v_uid_productor;
  DELETE FROM public.waste_contracts WHERE user_id = v_uid_productor;
  DELETE FROM public.treatment_managers WHERE user_id = v_uid_productor;
  DELETE FROM public.production_centers WHERE user_id = v_uid_productor;
  DELETE FROM public.companies WHERE user_id = v_uid_productor;

  INSERT INTO public.companies (
    user_id, razon_social, nombre_comercial, cif, nima,
    domicilio_social, codigo_postal_social, municipio_social, provincia_social,
    telefono, email, persona_contacto, tipo_empresa, roles, is_my_company,
    perfil_operativo, modulos_activos, onboarding_completado, activo
  ) VALUES (
    v_uid_productor, 'Industrias Metálicas del Sur S.L.', 'Metálicas del Sur', 'B41889901', '4100088901',
    'Pol. Ind. La Isla, C/ Acero 18', '41703', 'Dos Hermanas', 'Sevilla',
    '+34 954 112 233', 'medioambiente@metalicasdelsur.es', 'Carlos Productor', 'productor', ARRAY['productor'], true,
    'productor', ARRAY['empresas', 'contratos', 'di', 'deca', 'archivo_cronologico'], true, true
  ) RETURNING id INTO v_comp_prod_id;

  INSERT INTO public.companies (
    user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion,
    domicilio_social, municipio_social, provincia_social,
    tipo_empresa, roles, is_my_company, perfil_operativo, onboarding_completado, activo
  ) VALUES (
    v_uid_productor, 'Gestor Ambiental del Guadalquivir S.A.', 'Guadalquivir Residuos', 'A41554433', '4100055443', 'G-AN-2023/0144',
    'Ctra. Amarilla km 4', 'Sevilla', 'Sevilla',
    'gestor', ARRAY['gestor'], false, 'gestor_rp', true, true
  ) RETURNING id INTO v_comp_prod_gestor_id;

  INSERT INTO public.production_centers (company_id, user_id, nombre, direccion, nima, municipio, provincia, codigo_postal, tipo_instalacion, activo)
  VALUES (v_comp_prod_id, v_uid_productor, 'Nave Mecanizado Dos Hermanas', 'Pol. Ind. La Isla, C/ Acero 18', '4100088901', 'Dos Hermanas', 'Sevilla', '41703', 'produccion', true)
  RETURNING id INTO v_center_prod_id;

  INSERT INTO public.treatment_managers (user_id, nombre, razon_social, cif, nima, numero_autorizacion, direccion, municipio, provincia, activo)
  VALUES (v_uid_productor, 'Guadalquivir Residuos', 'Gestor Ambiental del Guadalquivir S.A.', 'A41554433', '4100055443', 'G-AN-2023/0144', 'Ctra. Amarilla km 4', 'Sevilla', 'Sevilla', true)
  RETURNING id INTO v_tm_prod_id;

  INSERT INTO public.waste_contracts (
    user_id, company_id, gestor_company_id, treatment_manager_id, numero_contrato,
    fecha_contrato, fecha_inicio, fecha_fin, tipo_contrato,
    descripcion_residuos, operaciones_tratamiento, cantidad_maxima_anual, unidad_cantidad, estado
  ) VALUES (
    v_uid_productor, v_comp_prod_id, v_comp_prod_gestor_id, v_tm_prod_id, 'CTR-PROD-2026/01',
    '2026-01-15', '2026-01-15', '2027-01-14', 'tratamiento',
    'Aceites hidráulicos (130205*), taladrinas agotadas (120109*) y envases contaminados (150110*).',
    ARRAY['R09', 'D09', 'R04'], 25.0, 'toneladas', 'vigente'
  ) RETURNING id INTO v_ctr_prod_id;

  INSERT INTO public.identification_documents (
    user_id, company_id, contract_id, numero_documento, fecha_documento, tipo_notificacion,
    productor_razon_social, productor_cif, productor_nima, productor_direccion, productor_municipio, productor_provincia,
    gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion, gestor_municipio, gestor_provincia,
    transportista_razon_social, transportista_cif, transportista_matricula,
    codigo_ler, descripcion_residuo, estado_fisico, peligrosidad, cantidad, unidad, operacion_tratamiento,
    fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista, estado, estado_traslado
  ) VALUES
  (v_uid_productor, v_comp_prod_id, v_ctr_prod_id, 'DI-PROD-2026-001', '2026-03-10', 'con-notificacion-previa',
   'Industrias Metálicas del Sur S.L.', 'B41889901', '4100088901', 'Pol. Ind. La Isla, C/ Acero 18', 'Dos Hermanas', 'Sevilla',
   'Gestor Ambiental del Guadalquivir S.A.', 'A41554433', '4100055443', 'G-AN-2023/0144', 'Sevilla', 'Sevilla',
   'TransLogística Ambiental Express S.L.', 'B28776655', '4812-MTR',
   '13 02 05*', 'Aceites minerales no clorados de motor y lubricación', 'liquido', 'peligroso', 840, 'kg', 'R09',
   '2026-03-10', '2026-03-10', true, true, true, 'completado', 'tratado')
  RETURNING id INTO v_di_p1;

  INSERT INTO public.identification_documents (
    user_id, company_id, contract_id, numero_documento, fecha_documento, tipo_notificacion,
    productor_razon_social, productor_cif, productor_nima, productor_direccion, productor_municipio, productor_provincia,
    gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion, gestor_municipio, gestor_provincia,
    transportista_razon_social, transportista_cif, transportista_matricula,
    codigo_ler, descripcion_residuo, estado_fisico, peligrosidad, cantidad, unidad, operacion_tratamiento,
    fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, firmado_transportista, estado, estado_traslado
  ) VALUES
  (v_uid_productor, v_comp_prod_id, v_ctr_prod_id, 'DI-PROD-2026-002', '2026-05-22', 'con-notificacion-previa',
   'Industrias Metálicas del Sur S.L.', 'B41889901', '4100088901', 'Pol. Ind. La Isla, C/ Acero 18', 'Dos Hermanas', 'Sevilla',
   'Gestor Ambiental del Guadalquivir S.A.', 'A41554433', '4100055443', 'G-AN-2023/0144', 'Sevilla', 'Sevilla',
   'TransLogística Ambiental Express S.L.', 'B28776655', '4812-MTR',
   '12 01 09*', 'Emulsiones y disoluciones de mecanizado sin halógenos', 'liquido', 'peligroso', 1200, 'kg', 'D09',
   '2026-05-22', '2026-05-22', true, true, true, 'completado', 'tratado')
  RETURNING id INTO v_di_p2;

  INSERT INTO public.identification_documents (
    user_id, company_id, contract_id, numero_documento, fecha_documento, tipo_notificacion,
    productor_razon_social, productor_cif, productor_nima, productor_direccion, productor_municipio, productor_provincia,
    gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion, gestor_municipio, gestor_provincia,
    transportista_razon_social, transportista_cif, transportista_matricula,
    codigo_ler, descripcion_residuo, estado_fisico, peligrosidad, cantidad, unidad, operacion_tratamiento,
    fecha_recogida, firmado_productor, firmado_gestor, firmado_transportista, estado, estado_traslado
  ) VALUES
  (v_uid_productor, v_comp_prod_id, v_ctr_prod_id, 'DI-PROD-2026-003', '2026-10-18', 'con-notificacion-previa',
   'Industrias Metálicas del Sur S.L.', 'B41889901', '4100088901', 'Pol. Ind. La Isla, C/ Acero 18', 'Dos Hermanas', 'Sevilla',
   'Gestor Ambiental del Guadalquivir S.A.', 'A41554433', '4100055443', 'G-AN-2023/0144', 'Sevilla', 'Sevilla',
   'TransLogística Ambiental Express S.L.', 'B28776655', '4812-MTR',
   '15 01 10*', 'Envases metálicos con restos de pintura y disolvente', 'solido', 'peligroso', 380, 'kg', 'R04',
   '2026-10-18', true, false, true, 'pendiente-firma', 'en_transito')
  RETURNING id INTO v_di_p3;

  INSERT INTO public.identification_documents (
    user_id, company_id, contract_id, numero_documento, fecha_documento, tipo_notificacion,
    productor_razon_social, productor_cif, productor_nima, productor_direccion, productor_municipio, productor_provincia,
    gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion, gestor_municipio, gestor_provincia,
    codigo_ler, descripcion_residuo, estado_fisico, peligrosidad, cantidad, unidad, operacion_tratamiento,
    firmado_productor, firmado_gestor, firmado_transportista, estado, estado_traslado
  ) VALUES
  (v_uid_productor, v_comp_prod_id, v_ctr_prod_id, 'DI-PROD-2026-004', '2026-11-05', 'sin-notificacion',
   'Industrias Metálicas del Sur S.L.', 'B41889901', '4100088901', 'Pol. Ind. La Isla, C/ Acero 18', 'Dos Hermanas', 'Sevilla',
   'Gestor Ambiental del Guadalquivir S.A.', 'A41554433', '4100055443', 'G-AN-2023/0144', 'Sevilla', 'Sevilla',
   '17 04 05', 'Recortes de chapa y viruta de acero', 'solido', 'no-peligroso', 2650, 'kg', 'R04',
   false, false, false, 'borrador', 'borrador')
  RETURNING id INTO v_di_p4;

  INSERT INTO public.chronological_registry (
    user_id, company_id, production_center_id, numero_asiento, fecha, tipo_operacion,
    codigo_ler, descripcion_residuo, peligrosidad, codigo_hp, estado_fisico, cantidad_kg,
    origen_tipo, origen_razon_social, origen_nima, destino_tipo, destino_razon_social, destino_nif, destino_nima,
    operacion_rd, identification_document_id, numero_documento_referencia
  ) VALUES
  (v_uid_productor, v_comp_prod_id, v_center_prod_id, 'AS-PROD-2026-001', '2026-03-05', 'produccion_interna', '13 02 05*', 'Aceites minerales no clorados', 'peligroso', ARRAY['HP5'], 'liquido', 840, 'propio', 'Industrias Metálicas del Sur S.L.', '4100088901', 'propio_tratamiento', NULL, NULL, NULL, NULL, NULL, 'PARTE-01'),
  (v_uid_productor, v_comp_prod_id, v_center_prod_id, 'AS-PROD-2026-002', '2026-03-10', 'salida_traslado', '13 02 05*', 'Aceites minerales no clorados', 'peligroso', ARRAY['HP5'], 'liquido', 840, 'propio', 'Industrias Metálicas del Sur S.L.', '4100088901', 'tercero_gestor', 'Gestor Ambiental del Guadalquivir S.A.', 'A41554433', '4100055443', 'R09', v_di_p1, 'DI-PROD-2026-001'),
  (v_uid_productor, v_comp_prod_id, v_center_prod_id, 'AS-PROD-2026-003', '2026-05-22', 'salida_traslado', '12 01 09*', 'Taladrina agotada sin halógenos', 'peligroso', ARRAY['HP14'], 'liquido', 1200, 'propio', 'Industrias Metálicas del Sur S.L.', '4100088901', 'tercero_gestor', 'Gestor Ambiental del Guadalquivir S.A.', 'A41554433', '4100055443', 'D09', v_di_p2, 'DI-PROD-2026-002');

  -- ============================================================================
  -- DATA 2: GESTOR / CHATARRERÍA INDEPENDIENTE (Chatarrería y Recuperaciones Toledo S.L.)
  -- ============================================================================
  DELETE FROM public.commercial_operations WHERE user_id = v_uid_gestor;
  DELETE FROM public.chronological_registry WHERE user_id = v_uid_gestor;
  DELETE FROM public.identification_documents WHERE user_id = v_uid_gestor;
  DELETE FROM public.production_centers WHERE user_id = v_uid_gestor;
  DELETE FROM public.companies WHERE user_id = v_uid_gestor;

  INSERT INTO public.companies (
    user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion,
    domicilio_social, codigo_postal_social, municipio_social, provincia_social,
    telefono, email, persona_contacto, tipo_empresa, roles, is_my_company,
    perfil_operativo, modulos_activos, onboarding_completado, activo
  ) VALUES (
    v_uid_gestor, 'Chatarrería y Recuperaciones Toledo S.L.', 'Recuperaciones Toledo', 'B45778899', '4500077889', 'G-CM-2022/0310',
    'Pol. Ind. Santa María de Benquerencia, C/ Jarama 92', '45007', 'Toledo', 'Toledo',
    '+34 925 334 455', 'bascula@recuperacionestoledo.es', 'Laura Gestor', 'gestor', ARRAY['gestor'], true,
    'chatarreria', ARRAY['empresas', 'di', 'deca', 'archivo_cronologico', 'operaciones_comerciales', 'memorias_anuales'], true, true
  ) RETURNING id INTO v_comp_gestor_id;

  INSERT INTO public.companies (
    user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion,
    domicilio_social, municipio_social, provincia_social,
    tipo_empresa, roles, is_my_company, perfil_operativo, onboarding_completado, activo
  ) VALUES (
    v_uid_gestor, 'Acerías y Fundiciones del Centro S.A.', 'Acerías del Centro', 'A28334411', '2800033441', 'G-MD-2020/0881',
    'Pol. Ind. El Pradillo', 'Illescas', 'Toledo',
    'gestor', ARRAY['gestor', 'cliente'], false, 'gestor_rp', true, true
  ) RETURNING id INTO v_comp_gestor_aceria_id;

  INSERT INTO public.production_centers (company_id, user_id, nombre, direccion, nima, municipio, provincia, codigo_postal, tipo_instalacion, activo)
  VALUES (v_comp_gestor_id, v_uid_gestor, 'Planta de Clasificación y Báscula Toledo', 'C/ Jarama 92, Toledo', '4500077889', 'Toledo', 'Toledo', '45007', 'tratamiento', true)
  RETURNING id INTO v_center_gestor_id;

  INSERT INTO public.identification_documents (
    user_id, company_id, numero_documento, fecha_documento, tipo_notificacion,
    productor_razon_social, productor_cif, productor_nima, productor_municipio, productor_provincia,
    gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion, gestor_municipio, gestor_provincia,
    codigo_ler, descripcion_residuo, estado_fisico, peligrosidad, cantidad, unidad, peso_origen_kg, peso_destino_kg,
    operacion_tratamiento, fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, estado, estado_traslado
  ) VALUES
  (v_uid_gestor, v_comp_gestor_id, 'DI-CHAT-2026-101', '2026-09-12', 'sin-notificacion',
   'Construcciones La Mancha S.L.', 'B45112233', '4500011223', 'Talavera', 'Toledo',
   'Chatarrería y Recuperaciones Toledo S.L.', 'B45778899', '4500077889', 'G-CM-2022/0310', 'Toledo', 'Toledo',
   '17 04 05', 'Hierro y acero de demolición', 'solido', 'no-peligroso', 14500, 'kg', 14500, 14380,
   'R04', '2026-09-12', '2026-09-12', true, true, 'completado', 'tratado')
  RETURNING id INTO v_di_g1;

  INSERT INTO public.identification_documents (
    user_id, company_id, numero_documento, fecha_documento, tipo_notificacion,
    productor_razon_social, productor_cif, productor_nima, productor_municipio, productor_provincia,
    gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion, gestor_municipio, gestor_provincia,
    codigo_ler, descripcion_residuo, estado_fisico, peligrosidad, cantidad, unidad, peso_origen_kg, peso_destino_kg,
    operacion_tratamiento, fecha_recogida, fecha_entrega, firmado_productor, firmado_gestor, estado, estado_traslado
  ) VALUES
  (v_uid_gestor, v_comp_gestor_id, 'DI-CHAT-2026-102', '2026-10-08', 'sin-notificacion',
   'Chatarrería y Recuperaciones Toledo S.L.', 'B45778899', '4500077889', 'Toledo', 'Toledo',
   'Acerías y Fundiciones del Centro S.A.', 'A28334411', '2800033441', 'G-MD-2020/0881', 'Illescas', 'Toledo',
   '19 12 02', 'Metales férreos clasificados y cizallados', 'solido', 'no-peligroso', 9200, 'kg', 9200, 9200,
   'R04', '2026-10-08', '2026-10-08', true, true, 'completado', 'tratado')
  RETURNING id INTO v_di_g2;

  INSERT INTO public.chronological_registry (
    user_id, company_id, production_center_id, numero_asiento, fecha, tipo_operacion,
    codigo_ler, descripcion_residuo, peligrosidad, estado_fisico, cantidad_kg,
    origen_tipo, origen_razon_social, origen_nima, destino_tipo, destino_razon_social, destino_nima,
    operacion_rd, identification_document_id, numero_documento_referencia
  ) VALUES
  (v_uid_gestor, v_comp_gestor_id, v_center_gestor_id, 'AS-CHAT-2026-001', '2026-09-12', 'entrada_recepcion', '17 04 05', 'Hierro y acero de demolición', 'no-peligroso', 'solido', 14380, 'tercero_productor', 'Construcciones La Mancha S.L.', '4500011223', 'propio_tratamiento', 'Chatarrería y Recuperaciones Toledo S.L.', '4500077889', 'R12', v_di_g1, 'TICKET-BAS-4012'),
  (v_uid_gestor, v_comp_gestor_id, v_center_gestor_id, 'AS-CHAT-2026-002', '2026-09-20', 'entrada_recepcion', '17 04 01', 'Cobre, bronce y latón', 'no-peligroso', 'solido', 2400, 'tercero_productor', 'Instalaciones Eléctricas Tajo S.L.', '4500099112', 'propio_tratamiento', 'Chatarrería y Recuperaciones Toledo S.L.', '4500077889', 'R13', NULL, 'TICKET-BAS-4029'),
  (v_uid_gestor, v_comp_gestor_id, v_center_gestor_id, 'AS-CHAT-2026-003', '2026-10-08', 'salida_traslado', '19 12 02', 'Metales férreos clasificados', 'no-peligroso', 'solido', 9200, 'propio', 'Chatarrería y Recuperaciones Toledo S.L.', '4500077889', 'tercero_gestor', 'Acerías y Fundiciones del Centro S.A.', '2800033441', 'R04', v_di_g2, 'DI-CHAT-2026-102');

  INSERT INTO public.commercial_operations (
    user_id, company_id, numero_operacion, fecha, estado,
    origen_nombre_personalizado, destino_gestor_id, destino_nombre_personalizado,
    codigo_ler, descripcion_residuo, peligrosidad, operacion_rd,
    cantidad_estimada_t, cantidad_real_t, identification_document_id, numero_albaran_gestor,
    proveedor_razon_social, tipo_precio_compra, precio_unitario_compra, coste_compra_total, estado_pago_compra,
    cliente_comercial_id, cliente_razon_social, tipo_precio_venta, precio_unitario_venta, ingreso_venta_total, estado_cobro_venta,
    coste_transporte, otros_costes, margen_bruto_total, margen_unitario_tonelada, porcentaje_margen
  ) VALUES (
    v_uid_gestor, v_comp_gestor_id, 'OP-CHAT-2026-001', '2026-10-08', 'liquidada',
    'Chatarrería y Recuperaciones Toledo S.L.', v_comp_gestor_aceria_id, 'Acerías y Fundiciones del Centro S.A.',
    '19 12 02', 'Chatarra férrea cizallada E3', 'no-peligroso', 'R04',
    9.200, 9.200, v_di_g2, 'ALB-ACERIA-881',
    'Construcciones La Mancha S.L.', 'por_tonelada', 135.00, 1242.00, 'pagado',
    v_comp_gestor_aceria_id, 'Acerías y Fundiciones del Centro S.A.', 'por_tonelada', 235.00, 2162.00, 'cobrado',
    210.00, 35.00, 675.00, 73.37, 31.22
  );

  -- ============================================================================
  -- DATA 3: TRANSPORTISTA INDEPENDIENTE (TransLogística Ambiental Express S.L.)
  -- ============================================================================
  DELETE FROM public.deca_documents WHERE user_id = v_uid_transportista;
  DELETE FROM public.identification_documents WHERE user_id = v_uid_transportista;
  DELETE FROM public.carriers WHERE user_id = v_uid_transportista;
  DELETE FROM public.companies WHERE user_id = v_uid_transportista;

  INSERT INTO public.companies (
    user_id, razon_social, nombre_comercial, cif, nima, numero_autorizacion, matricula,
    domicilio_social, codigo_postal_social, municipio_social, provincia_social,
    telefono, email, persona_contacto, tipo_empresa, roles, is_my_company,
    perfil_operativo, modulos_activos, onboarding_completado, activo
  ) VALUES (
    v_uid_transportista, 'TransLogística Ambiental Express S.L.', 'TransLogística Express', 'B28776655', '2800077665', 'T-MD-2023/0419', '4812-MTR',
    'Centro de Transportes de Coslada, C/ Mar Caribe 11', '28821', 'Coslada', 'Madrid',
    '+34 916 700 800', 'trafico@translogistica-express.es', 'Miguel Transportista', 'transportista', ARRAY['transportista'], true,
    'transportista', ARRAY['di', 'deca', 'flota_transporte'], true, true
  ) RETURNING id INTO v_comp_trans_id;

  INSERT INTO public.carriers (user_id, razon_social, cif, nima, numero_autorizacion, matricula, direccion, municipio, provincia, telefono, email, activo)
  VALUES (v_uid_transportista, 'TransLogística Ambiental Express S.L.', 'B28776655', '2800077665', 'T-MD-2023/0419', '4812-MTR', 'C/ Mar Caribe 11', 'Coslada', 'Madrid', '+34 916 700 800', 'trafico@translogistica-express.es', true);

  INSERT INTO public.identification_documents (
    user_id, company_id, numero_documento, fecha_documento, tipo_notificacion,
    productor_razon_social, productor_cif, productor_nima, productor_direccion, productor_municipio, productor_provincia,
    gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion, gestor_direccion, gestor_municipio, gestor_provincia,
    transportista_razon_social, transportista_cif, transportista_matricula,
    codigo_ler, descripcion_residuo, estado_fisico, peligrosidad, cantidad, unidad, operacion_tratamiento,
    fecha_recogida, firmado_productor, firmado_transportista, estado, estado_traslado
  ) VALUES
  (v_uid_transportista, v_comp_trans_id, 'DI-TRA-2026-201', CURRENT_DATE, 'con-notificacion-previa',
   'Talleres Automoción Getafe S.L.', 'B81223344', '2800011224', 'Avda. Isaac Newton 14', 'Getafe', 'Madrid',
   'Tratamientos Ibéricos S.A.', 'A28112233', '2800045678', 'G-MD-2022/9901', 'Avda. de la Industria 45', 'Alcobendas', 'Madrid',
   'TransLogística Ambiental Express S.L.', 'B28776655', '4812-MTR',
   '13 02 05*', 'Aceite mineral usado en GRG homologado', 'liquido', 'peligroso', 1050, 'kg', 'R09',
   CURRENT_DATE, true, true, 'pendiente-firma', 'en_transito')
  RETURNING id INTO v_di_t1;

  INSERT INTO public.identification_documents (
    user_id, company_id, numero_documento, fecha_documento, tipo_notificacion,
    productor_razon_social, productor_cif, productor_nima, productor_direccion, productor_municipio, productor_provincia,
    gestor_razon_social, gestor_cif, gestor_nima, gestor_numero_autorizacion, gestor_direccion, gestor_municipio, gestor_provincia,
    transportista_razon_social, transportista_cif, transportista_matricula,
    codigo_ler, descripcion_residuo, estado_fisico, peligrosidad, cantidad, unidad, operacion_tratamiento,
    fecha_recogida, firmado_productor, firmado_transportista, estado, estado_traslado
  ) VALUES
  (v_uid_transportista, v_comp_trans_id, 'DI-TRA-2026-202', CURRENT_DATE, 'sin-notificacion',
   'Logística Industrial Henares S.A.', 'A28990011', '2800099001', 'C/ Sierra Nevada 8', 'Alcalá de Henares', 'Madrid',
   'Recuperaciones Toledo S.L.', 'B45778899', '4500077889', 'G-CM-2022/0310', 'C/ Jarama 92', 'Toledo', 'Toledo',
   'TransLogística Ambiental Express S.L.', 'B28776655', '4812-MTR',
   '17 04 05', 'Chatarra metálica en cuba 20m3', 'solido', 'no-peligroso', 4800, 'kg', 'R04',
   CURRENT_DATE, true, false, 'pendiente-firma', 'programado')
  RETURNING id INTO v_di_t2;

  INSERT INTO public.deca_documents (
    user_id, company_id, identification_document_id, numero_deca, version, is_vigente, token,
    cargador_razon_social, cargador_nif, cargador_domicilio, cargador_municipio, cargador_provincia,
    transportista_razon_social, transportista_nif, transportista_nima, transportista_autorizacion,
    origen_direccion, origen_municipio, origen_provincia, origen_nima,
    destino_direccion, destino_municipio, destino_provincia, destino_nima,
    naturaleza_mercancia, peso_kg, codigo_ler, descripcion_ler, numero_di, es_residuo_peligroso, requiere_adr, materia_adr,
    matricula_tractora, matricula_remolque, conductor_nombre, conductor_dni, conductor_telefono,
    fecha_transporte, hora_salida, estado
  ) VALUES
  (v_uid_transportista, v_comp_trans_id, v_di_t1, 'DECA-TR-2026-001', 1, true, 'dca_demo_transportista_001_qr_token',
   'Talleres Automoción Getafe S.L.', 'B81223344', 'Avda. Isaac Newton 14', 'Getafe', 'Madrid',
   'TransLogística Ambiental Express S.L.', 'B28776655', '2800077665', 'T-MD-2023/0419',
   'Avda. Isaac Newton 14', 'Getafe', 'Madrid', '2800011224',
   'Avda. de la Industria 45', 'Alcobendas', 'Madrid', '2800045678',
   'Residuo peligroso: Aceite mineral usado (13 02 05*) en GRG 1000L', 1050, '13 02 05*', 'Aceites minerales no clorados de motor', 'DI-TRA-2026-201', true, false, NULL,
   '4812-MTR', 'R-9120-BCK', 'Miguel Transportista', '50123456A', '+34 600 111 222',
   CURRENT_DATE, '08:30', 'en_transito'),
  (v_uid_transportista, v_comp_trans_id, v_di_t2, 'DECA-TR-2026-002', 1, true, 'dca_demo_transportista_002_qr_token',
   'Logística Industrial Henares S.A.', 'A28990011', 'C/ Sierra Nevada 8', 'Alcalá de Henares', 'Madrid',
   'TransLogística Ambiental Express S.L.', 'B28776655', '2800077665', 'T-MD-2023/0419',
   'C/ Sierra Nevada 8', 'Alcalá de Henares', 'Madrid', '2800099001',
   'C/ Jarama 92', 'Toledo', 'Toledo', '4500077889',
   'Residuo no peligroso: Chatarra férrea industrial (17 04 05)', 4800, '17 04 05', 'Hierro y acero', 'DI-TRA-2026-202', false, false, NULL,
   '4812-MTR', NULL, 'Miguel Transportista', '50123456A', '+34 600 111 222',
   CURRENT_DATE, '11:00', 'vigente');

  -- ============================================================================
  -- DATA 4 (BLOQUE 2): CONSULTOR MÉTODO AMBIENTAL (MULTI-EMPRESA)
  -- ============================================================================
  DELETE FROM public.company_memberships WHERE user_id = v_uid_consultor;
  DELETE FROM public.companies WHERE user_id = v_uid_consultor;

  INSERT INTO public.companies (
    user_id, razon_social, nombre_comercial, cif,
    domicilio_social, municipio_social, provincia_social,
    telefono, email, persona_contacto, tipo_empresa, roles, is_my_company,
    perfil_operativo, modulos_activos, onboarding_completado, activo
  ) VALUES (
    v_uid_consultor, 'Método Ambiental Consultoría S.L.', 'Método Ambiental', 'B90112233',
    'Avda. República Argentina 24', 'Sevilla', 'Sevilla',
    '+34 954 000 111', 'consultoria@metodoambiental.es', 'Elena Consultora', 'agente', ARRAY['agente'], true,
    'gestor_rp', ARRAY['empresas', 'contratos', 'gestores', 'di', 'deca', 'archivo_cronologico', 'memorias_anuales', 'sira_integraciones'], true, true
  ) RETURNING id INTO v_comp_consultor_id;

  -- Vincular al consultor con las empresas cliente de prueba (SIN acceso comercial)
  INSERT INTO public.company_memberships (company_id, user_id, role, can_view_commercial)
  VALUES
    (v_comp_prod_id, v_uid_consultor, 'consultor_admin', false),
    (v_comp_gestor_id, v_uid_consultor, 'consultor_operador', false)
  ON CONFLICT (company_id, user_id) DO UPDATE SET
    role = EXCLUDED.role,
    can_view_commercial = EXCLUDED.can_view_commercial;

  -- ============================================================================
  -- DATA 5 (BLOQUE 2): NEGOCIANTE AISLADO (Iberia Waste Trading S.L.)
  -- ============================================================================
  DELETE FROM public.commercial_operations WHERE user_id = v_uid_negociante;
  DELETE FROM public.companies WHERE user_id = v_uid_negociante;

  INSERT INTO public.companies (
    user_id, razon_social, nombre_comercial, cif, nima, numero_inscripcion,
    domicilio_social, municipio_social, provincia_social,
    telefono, email, persona_contacto, tipo_empresa, roles, is_my_company,
    perfil_operativo, modulos_activos, onboarding_completado, activo
  ) VALUES (
    v_uid_negociante, 'Iberia Waste Trading S.L.', 'Iberia Waste Trading', 'B89445566', '2800055667', 'NEG-MD-2024-0044',
    'C/ Velázquez 64', 'Madrid', 'Madrid',
    '+34 917 400 300', 'comercial@iberiawaste.es', 'Gonzalo Negociante', 'negociante', ARRAY['negociante'], true,
    'negociante', ARRAY['empresas', 'contratos', 'gestores', 'flota_transporte', 'di', 'deca', 'operaciones_comerciales', 'memorias_anuales'], true, true
  ) RETURNING id INTO v_comp_neg_id;

  INSERT INTO public.companies (user_id, razon_social, cif, nima, tipo_empresa, roles, is_my_company, onboarding_completado, activo)
  VALUES (v_uid_negociante, 'Proveedor Metalúrgico Norte S.A.', 'A48112233', '4800011223', 'productor', ARRAY['productor'], false, true, true)
  RETURNING id INTO v_comp_neg_prov_id;

  INSERT INTO public.companies (user_id, razon_social, cif, nima, numero_autorizacion, tipo_empresa, roles, is_my_company, onboarding_completado, activo)
  VALUES (v_uid_negociante, 'Fundición Reciclados Cantabria S.A.', 'A39556677', '3900055667', 'G-CB-2021/0091', 'gestor', ARRAY['gestor'], false, true, true)
  RETURNING id INTO v_comp_neg_cli_id;

  INSERT INTO public.commercial_operations (
    user_id, company_id, numero_operacion, fecha, estado,
    origen_productor_id, origen_nombre_personalizado, destino_gestor_id, destino_nombre_personalizado,
    codigo_ler, descripcion_residuo, peligrosidad, operacion_rd,
    cantidad_estimada_t, cantidad_real_t,
    proveedor_comercial_id, proveedor_razon_social, tipo_precio_compra, precio_unitario_compra, coste_compra_total, estado_pago_compra,
    cliente_comercial_id, cliente_razon_social, tipo_precio_venta, precio_unitario_venta, ingreso_venta_total, estado_cobro_venta,
    coste_transporte, otros_costes, margen_bruto_total, margen_unitario_tonelada, porcentaje_margen, observaciones
  ) VALUES (
    v_uid_negociante, v_comp_neg_id, 'OP-NEG-2026-001', '2026-10-20', 'liquidada',
    v_comp_neg_prov_id, 'Proveedor Metalúrgico Norte S.A.', v_comp_neg_cli_id, 'Fundición Reciclados Cantabria S.A.',
    '12 01 01', 'Virutas de acero inoxidable 316L', 'no-peligroso', 'R04',
    18.000, 18.450,
    v_comp_neg_prov_id, 'Proveedor Metalúrgico Norte S.A.', 'por_tonelada', 780.00, 14391.00, 'pagado',
    v_comp_neg_cli_id, 'Fundición Reciclados Cantabria S.A.', 'por_tonelada', 960.00, 17712.00, 'cobrado',
    640.00, 95.00, 2586.00, 140.16, 14.60, 'Operación confidencial de trading de acero inoxidable.'
  );

  RAISE NOTICE 'Seed de 6 cuentas de prueba independientes completado con éxito.';
END $$;
