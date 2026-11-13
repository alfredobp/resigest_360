-- ==============================================================================
-- CORRECCIÓN INMEDIATA: ERROR "Database error querying schema" EN SUPABASE AUTH
-- ==============================================================================
-- Este error ocurre en Supabase GoTrue cuando los usuarios creados por SQL tienen
-- campos de token en NULL o no tienen su registro correspondiente en auth.identities.
--
-- Ejecuta este script en el SQL Editor de tu proyecto Supabase para solucionarlo.
-- ==============================================================================

-- 1. Reemplazar NULL por '' en todas las columnas de tokens de auth.users
DO $$
DECLARE
  v_col text;
BEGIN
  FOR v_col IN 
    SELECT column_name 
    FROM information_schema.columns 
    WHERE table_schema = 'auth' 
      AND table_name = 'users' 
      AND column_name IN (
        'confirmation_token', 
        'recovery_token', 
        'email_change', 
        'email_change_token_new', 
        'email_change_token_current', 
        'phone_change', 
        'phone_change_token', 
        'reauthentication_token'
      )
  LOOP
    EXECUTE format('UPDATE auth.users SET %I = '''' WHERE %I IS NULL AND (email LIKE ''%%.prueba@%%'' OR email LIKE ''%%@metodoambiental.test'')', v_col, v_col);
  END LOOP;
END $$;

-- 2. Asegurar que las contraseñas estén correctamente encriptadas y confirmadas
UPDATE auth.users
SET 
  encrypted_password = crypt('ResigestTest2026!', gen_salt('bf')),
  email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
  aud = 'authenticated',
  role = 'authenticated'
WHERE email IN (
  'productor.prueba@resigest.test',
  'gestor.prueba@resigest.test',
  'transportista.prueba@resigest.test',
  'nuevo.prueba@resigest.test',
  'consultor.prueba@metodoambiental.test',
  'negociante.prueba@resigest.test'
);

-- 3. Crear las identidades en auth.identities para que GoTrue permita autenticar por email/password
DO $$
DECLARE
  v_id_type text;
BEGIN
  SELECT data_type INTO v_id_type 
  FROM information_schema.columns 
  WHERE table_schema = 'auth' AND table_name = 'identities' AND column_name = 'id';

  IF v_id_type = 'text' OR v_id_type = 'character varying' THEN
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    SELECT
      u.id::text,
      u.id,
      u.id::text,
      json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    FROM auth.users u
    WHERE (u.email LIKE '%.prueba@%' OR u.email LIKE '%@metodoambiental.test')
      AND NOT EXISTS (
        SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
      );
  ELSE
    INSERT INTO auth.identities (
      id,
      user_id,
      provider_id,
      identity_data,
      provider,
      last_sign_in_at,
      created_at,
      updated_at
    )
    SELECT
      u.id,
      u.id,
      u.id::text,
      json_build_object('sub', u.id::text, 'email', u.email)::jsonb,
      'email',
      NOW(),
      NOW(),
      NOW()
    FROM auth.users u
    WHERE (u.email LIKE '%.prueba@%' OR u.email LIKE '%@metodoambiental.test')
      AND NOT EXISTS (
        SELECT 1 FROM auth.identities i WHERE i.user_id = u.id AND i.provider = 'email'
      );
  END IF;
END $$;

