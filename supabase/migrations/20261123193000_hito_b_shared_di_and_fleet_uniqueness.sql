-- ==============================================================================
-- MIGRACIÓN HITO B: VINCULACIÓN DE TRASLADOS COMPARTIDOS (INC07) Y UNICIDAD DE FLOTA (INC10)
-- Sexta Auditoría RESIGEST 360 (23/11/2026)
-- ==============================================================================

-- 1. INC07: Trigger BEFORE INSERT OR UPDATE en identification_documents para enlazar
-- automáticamente transportista_company_id y gestor_company_id cuando el CIF o NIMA
-- coincide con una empresa titular activa registrada en RESIGEST 360 (is_my_company = true).
CREATE OR REPLACE FUNCTION public.link_registered_participants_on_di()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trans_id BIGINT;
  v_gestor_id BIGINT;
BEGIN
  -- Resolver transportista registrado por CIF o NIMA si no viene transportista_company_id
  IF NEW.transportista_company_id IS NULL AND (
    (NEW.transportista_cif IS NOT NULL AND BTRIM(NEW.transportista_cif) <> '')
    OR (NEW.transportista_nima IS NOT NULL AND BTRIM(NEW.transportista_nima) <> '')
  ) THEN
    SELECT c.id INTO v_trans_id
      FROM public.companies c
     WHERE c.is_my_company = true
       AND COALESCE(c.activo, true) = true
       AND (
         (NEW.transportista_cif IS NOT NULL AND BTRIM(NEW.transportista_cif) <> '' AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(NEW.transportista_cif)))
         OR (NEW.transportista_nima IS NOT NULL AND BTRIM(NEW.transportista_nima) <> '' AND BTRIM(c.nima) = BTRIM(NEW.transportista_nima))
       )
     ORDER BY c.created_at ASC
     LIMIT 1;

    IF v_trans_id IS NOT NULL THEN
      NEW.transportista_company_id := v_trans_id;
    END IF;
  END IF;

  -- Resolver gestor registrado por CIF o NIMA si no viene gestor_company_id
  IF NEW.gestor_company_id IS NULL AND (
    (NEW.gestor_cif IS NOT NULL AND BTRIM(NEW.gestor_cif) <> '')
    OR (NEW.gestor_nima IS NOT NULL AND BTRIM(NEW.gestor_nima) <> '')
  ) THEN
    SELECT c.id INTO v_gestor_id
      FROM public.companies c
     WHERE c.is_my_company = true
       AND COALESCE(c.activo, true) = true
       AND (
         (NEW.gestor_cif IS NOT NULL AND BTRIM(NEW.gestor_cif) <> '' AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(NEW.gestor_cif)))
         OR (NEW.gestor_nima IS NOT NULL AND BTRIM(NEW.gestor_nima) <> '' AND BTRIM(c.nima) = BTRIM(NEW.gestor_nima))
       )
     ORDER BY c.created_at ASC
     LIMIT 1;

    IF v_gestor_id IS NOT NULL THEN
      NEW.gestor_company_id := v_gestor_id;
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_link_registered_participants_on_di ON public.identification_documents;
CREATE TRIGGER trg_link_registered_participants_on_di
  BEFORE INSERT OR UPDATE ON public.identification_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.link_registered_participants_on_di();

-- Backfill: Vincular DIs existentes cuyos CIF/NIMA coincidan con empresas titulares registradas
UPDATE public.identification_documents d
   SET transportista_company_id = c.id
  FROM public.companies c
 WHERE d.transportista_company_id IS NULL
   AND c.is_my_company = true
   AND COALESCE(c.activo, true) = true
   AND (
     (d.transportista_cif IS NOT NULL AND BTRIM(d.transportista_cif) <> '' AND UPPER(BTRIM(c.cif)) = UPPER(BTRIM(d.transportista_cif)))
     OR (d.transportista_nima IS NOT NULL AND BTRIM(d.transportista_nima) <> '' AND BTRIM(c.nima) = BTRIM(d.transportista_nima))
   );

-- 2. INC10: Índice único de matrícula normalizada por empresa activa en carrier_vehicles
DO $$
BEGIN
  IF to_regclass('public.carrier_vehicles') IS NOT NULL THEN
    -- Desactivar posibles duplicados activos previos conservando la ficha más reciente
    WITH ranked AS (
      SELECT id,
             ROW_NUMBER() OVER (
               PARTITION BY COALESCE(company_id, 0), user_id, UPPER(REGEXP_REPLACE(matricula, '[\s-]+', '', 'g'))
               ORDER BY updated_at DESC NULLS LAST, id DESC
             ) AS rn
        FROM public.carrier_vehicles
       WHERE COALESCE(activo, true) = true
    )
    UPDATE public.carrier_vehicles v
       SET activo = false
      FROM ranked r
     WHERE v.id = r.id
       AND r.rn > 1;

    CREATE UNIQUE INDEX IF NOT EXISTS uq_carrier_vehicles_company_norm_plate
      ON public.carrier_vehicles (
        COALESCE(company_id, 0),
        user_id,
        UPPER(REGEXP_REPLACE(matricula, '[\s-]+', '', 'g'))
      )
      WHERE COALESCE(activo, true) = true;
  END IF;
END $$;
