-- ==============================================================================
-- RESIGEST 360 - SCRIPT DE LIMPIEZA COMPLETA DE BASE DE DATOS (ENTORNO PILOTO/TEST)
-- ==============================================================================
-- ⚠️ ADVERTENCIA: Este script ELIMINA TODOS LOS DATOS OPERATIVOS de la base de datos.
--
-- QUÉ LIMPIA:
--   - Empresas, centros de producción, delegaciones y secuencias documentales
--   - Contratos, DIs, ítems de DI, Notificaciones Previas (NT), DeCA y documentos firmados
--   - Archivo cronológico, operaciones comerciales, memorias anuales y envíos SIRA
--   - Flota (vehículos, conductores, transportistas), gestores y autorizaciones
--   - Registros de auditoría (audit_logs, deca_audit_logs)
--   - Usuarios y perfiles NO administradores (controlado por v_delete_non_admin_users)
--
-- QUÉ CONSERVA INTACTO:
--   - Catálogo oficial de residuos LER (public.waste_types)
--   - Cuentas con rol 'admin' / 'superadmin' y 'alfredobape@gmail.com'
--   - Estructura de tablas, funciones RPC, triggers y políticas RLS
-- ==============================================================================

BEGIN;

DO $$
DECLARE
    -- Cambia a FALSE si quieres conservar las cuentas de usuarios normales y borrar solo sus datos
    v_delete_non_admin_users BOOLEAN := TRUE;

    v_table TEXT;
    v_tables TEXT[] := ARRAY[
        'public.audit_logs',
        'public.deca_audit_logs',
        'public.deca_documents',
        'public.sira_submissions',
        'public.signed_documents',
        'public.identification_document_items',
        'public.identification_documents',
        'public.prior_notifications',
        'public.chronological_registry',
        'public.commercial_operations',
        'public.memorias_anuales',
        'public.annual_report_lines',
        'public.annual_reports',
        'public.contract_waste_codes',
        'public.waste_contracts',
        'public.authorization_waste_codes',
        'public.environmental_authorizations',
        'public.carrier_drivers',
        'public.carrier_vehicles',
        'public.carriers',
        'public.treatment_manager_company_map',
        'public.treatment_managers',
        'public.company_document_sequences',
        'public.company_memberships',
        'public.production_centers',
        'public.companies'
    ];
    v_deleted_profiles INTEGER := 0;
    v_deleted_auth_users INTEGER := 0;
    v_remaining_ler INTEGER := 0;
    v_remaining_admins INTEGER := 0;
BEGIN
    -- 1. Vaciar todas las tablas operativas existentes reiniciando secuencias
    FOREACH v_table IN ARRAY v_tables LOOP
        IF to_regclass(v_table) IS NOT NULL THEN
            EXECUTE format('TRUNCATE TABLE %s RESTART IDENTITY CASCADE;', v_table);
            RAISE NOTICE 'Tabla vaciada: %', v_table;
        END IF;
    END LOOP;

    -- 2. Eliminar usuarios no administradores (opcional)
    IF v_delete_non_admin_users THEN
        IF to_regclass('public.profiles') IS NOT NULL THEN
            DELETE FROM public.profiles
             WHERE COALESCE(role::TEXT, 'user') NOT IN ('admin', 'superadmin')
               AND LOWER(BTRIM(COALESCE(email, ''))) NOT IN ('alfredobape@gmail.com', 'admin@resigest.com');
            GET DIAGNOSTICS v_deleted_profiles = ROW_COUNT;
        END IF;

        DELETE FROM auth.users u
         WHERE LOWER(BTRIM(COALESCE(u.email, ''))) NOT IN ('alfredobape@gmail.com', 'admin@resigest.com')
           AND NOT EXISTS (
               SELECT 1
                 FROM public.profiles p
                WHERE p.id = u.id
                  AND p.role::TEXT IN ('admin', 'superadmin')
           );
        GET DIAGNOSTICS v_deleted_auth_users = ROW_COUNT;
    END IF;

    -- 3. Comprobación final de catálogos y administradores conservados
    IF to_regclass('public.waste_types') IS NOT NULL THEN
        SELECT COUNT(*) INTO v_remaining_ler FROM public.waste_types;
    END IF;

    IF to_regclass('public.profiles') IS NOT NULL THEN
        SELECT COUNT(*) INTO v_remaining_admins
          FROM public.profiles
         WHERE role::TEXT IN ('admin', 'superadmin')
            OR LOWER(BTRIM(COALESCE(email, ''))) IN ('alfredobape@gmail.com', 'admin@resigest.com');
    END IF;

    RAISE NOTICE '=======================================================';
    RAISE NOTICE 'LIMPIEZA COMPLETADA CON ÉXITO';
    RAISE NOTICE 'Perfiles eliminados: % | Usuarios auth eliminados: %', v_deleted_profiles, v_deleted_auth_users;
    RAISE NOTICE 'Catálogo LER (waste_types) conservado: % registros', v_remaining_ler;
    RAISE NOTICE 'Cuentas admin conservadas: %', v_remaining_admins;
    RAISE NOTICE '=======================================================';
END $$;

COMMIT;
