-- ==============================================================================
-- RESIGEST 360 - CREAR O ACTUALIZAR USUARIO ADMINISTRADOR EN SUPABASE AUTH
-- ==============================================================================
-- Ejecuta este script en el SQL Editor de Supabase para poder iniciar sesión con:
-- Email: alfredobape@gmail.com
-- Contraseña: AdminResigest2026!
-- ==============================================================================

CREATE EXTENSION IF NOT EXISTS pgcrypto;

DO $$
DECLARE
    v_user_id UUID;
    v_password TEXT := 'AdminResigest2026!';
BEGIN
    -- 1. Buscar si ya existe el usuario en auth.users
    SELECT id INTO v_user_id FROM auth.users WHERE email = 'alfredobape@gmail.com' LIMIT 1;

    IF v_user_id IS NULL THEN
        v_user_id := gen_random_uuid();
        
        -- Insertar en auth.users
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
            'alfredobape@gmail.com',
            crypt(v_password, gen_salt('bf')),
            NOW(),
            'authenticated',
            'authenticated',
            '{"provider":"email","providers":["email"]}'::jsonb,
            '{"first_name":"Alfredo","last_name":"Administrador","company_name":"Resigest 360 Global"}'::jsonb,
            NOW(),
            NOW()
        );
        
        RAISE NOTICE 'Usuario alfredobape@gmail.com CREADO con éxito.';
    ELSE
        -- Si ya existía, resetear la contraseña
        UPDATE auth.users
        SET encrypted_password = crypt(v_password, gen_salt('bf')),
            email_confirmed_at = COALESCE(email_confirmed_at, NOW()),
            role = 'authenticated',
            aud = 'authenticated',
            updated_at = NOW()
        WHERE id = v_user_id;
        
        RAISE NOTICE 'Contraseña de alfredobape@gmail.com ACTUALIZADA con éxito.';
    END IF;

    -- 2. Asegurar que la columna role en profiles sea TEXT y tenga valor 'admin'
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

    -- 3. Crear o actualizar el perfil en public.profiles
    INSERT INTO public.profiles (
        id, email, first_name, last_name, role, created_at, updated_at
    ) VALUES (
        v_user_id,
        'alfredobape@gmail.com',
        'Alfredo',
        'Administrador',
        'admin',
        NOW(),
        NOW()
    )
    ON CONFLICT (id) DO UPDATE 
    SET role = 'admin',
        email = 'alfredobape@gmail.com',
        updated_at = NOW();

    -- También asegurar que demo@resigest.com tenga rol admin si existe
    UPDATE public.profiles SET role = 'admin' WHERE email = 'demo@resigest.com';

END $$;
