-- ==============================================================================
-- MIGRACIÓN: BLINDAJE EN SERVIDOR DE NOTIFICACIÓN PREVIA (NT) AL EXPEDIR UN DI
-- Incidencia INC02 (P0 · Sexta Auditoría 23/11/2026) · Arts. 3.2, 8 y 9 RD 553/2020
-- Impide pasar un DI sujeto a NT a 'en_transito' (o posterior) si la NT está
-- en borrador, no acreditada, futura, caducada o no pertenece a la organización.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.enforce_nt_validation_on_di_departure()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_requires_nt BOOLEAN := FALSE;
  v_op TEXT := UPPER(TRIM(COALESCE(NEW.operacion_tratamiento_ejecutada, NEW.operacion_tratamiento, '')));
  v_ler TEXT := COALESCE(NEW.codigo_ler, '');
  v_clean_ler TEXT := REGEXP_REPLACE(v_ler, '\D', '', 'g');
  v_departure_day DATE;
  v_nt RECORD;
BEGIN
  -- Solo aplicar cuando el DI entra en fase operativa (en_transito o posterior)
  IF COALESCE(NEW.estado_traslado, 'borrador') NOT IN ('en_transito', 'recepcionado', 'aceptado', 'tratado') THEN
    RETURN NEW;
  END IF;

  -- Solo re-validar en INSERT operativo o cuando cambia estado_traslado / NT / fecha_salida / peligrosidad
  IF TG_OP = 'UPDATE'
     AND COALESCE(OLD.estado_traslado, 'borrador') IN ('en_transito', 'recepcionado', 'aceptado', 'tratado')
     AND COALESCE(OLD.prior_notification_id, -1) = COALESCE(NEW.prior_notification_id, -1)
     AND COALESCE(OLD.numero_notificacion, '') = COALESCE(NEW.numero_notificacion, '')
     AND COALESCE(OLD.fecha_salida::text, '') = COALESCE(NEW.fecha_salida::text, '') THEN
    RETURN NEW;
  END IF;

  -- Determinar sujeción a Notificación Previa (Art. 3.2 RD 553/2020)
  v_requires_nt :=
    COALESCE(NEW.tipo_notificacion, '') = 'con-notificacion-previa'
    OR COALESCE(NEW.peligrosidad, '') = 'peligroso'
    OR POSITION('*' IN v_ler) > 0
    OR v_op LIKE 'D%'
    OR v_op LIKE 'R01%'
    OR v_op = 'R1'
    OR v_clean_ler = '200301';

  IF NOT v_requires_nt THEN
    RETURN NEW;
  END IF;

  IF COALESCE(NEW.tipo_notificacion, '') = 'sin-notificacion' THEN
    RAISE EXCEPTION 'No se puede iniciar el traslado: este residuo u operación exige Notificación Previa (art. 3.2 RD 553/2020).'
      USING ERRCODE = 'check_violation';
  END IF;

  IF NEW.prior_notification_id IS NULL AND TRIM(COALESCE(NEW.numero_notificacion, '')) = '' THEN
    RAISE EXCEPTION 'No se puede iniciar el traslado: falta una Notificación Previa (NT) acreditada y vigente (arts. 8 y 9 RD 553/2020).'
      USING ERRCODE = 'check_violation';
  END IF;

  -- Buscar NT perteneciente al mismo tenant (company_id o user_id)
  IF NEW.prior_notification_id IS NOT NULL THEN
    SELECT id, numero_notificacion, estado, fecha_inicio, fecha_fin
      INTO v_nt
      FROM public.prior_notifications
     WHERE id = NEW.prior_notification_id
       AND (
         (NEW.company_id IS NOT NULL AND company_id = NEW.company_id)
         OR user_id = NEW.user_id
       )
     LIMIT 1;
  ELSE
    SELECT id, numero_notificacion, estado, fecha_inicio, fecha_fin
      INTO v_nt
      FROM public.prior_notifications
     WHERE numero_notificacion = TRIM(NEW.numero_notificacion)
       AND (
         (NEW.company_id IS NOT NULL AND company_id = NEW.company_id)
         OR user_id = NEW.user_id
       )
     LIMIT 1;
  END IF;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No se puede iniciar el traslado: la Notificación Previa indicada no existe o no pertenece a tu organización (art. 8 RD 553/2020).'
      USING ERRCODE = 'check_violation';
  END IF;

  IF COALESCE(v_nt.estado, 'borrador') NOT IN ('enviada_sira', 'aceptada') THEN
    RAISE EXCEPTION 'No se puede iniciar el traslado: la Notificación Previa % está en estado % y debe estar presentada o aceptada (arts. 8 y 9 RD 553/2020).',
      COALESCE(v_nt.numero_notificacion, v_nt.id::text),
      COALESCE(v_nt.estado, 'borrador')
      USING ERRCODE = 'check_violation';
  END IF;

  v_departure_day := COALESCE((NEW.fecha_salida AT TIME ZONE 'Europe/Madrid')::date, NEW.fecha_documento::date, CURRENT_DATE);

  IF v_nt.fecha_inicio IS NOT NULL AND v_departure_day < v_nt.fecha_inicio THEN
    RAISE EXCEPTION 'No se puede iniciar el traslado el %: la Notificación Previa % no inicia su vigencia hasta el % (art. 8 RD 553/2020).',
      v_departure_day,
      COALESCE(v_nt.numero_notificacion, v_nt.id::text),
      v_nt.fecha_inicio
      USING ERRCODE = 'check_violation';
  END IF;

  IF v_nt.fecha_fin IS NOT NULL AND v_departure_day > v_nt.fecha_fin THEN
    RAISE EXCEPTION 'No se puede iniciar el traslado el %: la Notificación Previa % caducó el % (art. 8 RD 553/2020).',
      v_departure_day,
      COALESCE(v_nt.numero_notificacion, v_nt.id::text),
      v_nt.fecha_fin
      USING ERRCODE = 'check_violation';
  END IF;

  -- Enlazar prior_notification_id si solo se aportó numero_notificacion válido
  IF NEW.prior_notification_id IS NULL THEN
    NEW.prior_notification_id := v_nt.id;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_nt_validation_on_di_departure ON public.identification_documents;
CREATE TRIGGER trg_enforce_nt_validation_on_di_departure
  BEFORE INSERT OR UPDATE ON public.identification_documents
  FOR EACH ROW
  EXECUTE FUNCTION public.enforce_nt_validation_on_di_departure();
