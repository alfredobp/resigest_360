-- ==============================================================================
-- JUSTIFICACIÓN DE DISCREPANCIAS DE BÁSCULA EN DI (RD 553/2020)
-- Permite documentar el motivo de desviaciones de peso entre origen y destino
-- sin registrarlas como incidencia/rechazo.
-- ==============================================================================

ALTER TABLE public.identification_documents
  ADD COLUMN IF NOT EXISTS causa_discrepancia TEXT,
  ADD COLUMN IF NOT EXISTS justificacion_discrepancia TEXT,
  ADD COLUMN IF NOT EXISTS justificacion_discrepancia_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS justificacion_discrepancia_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS justificacion_discrepancia_by_nombre TEXT;

ALTER TABLE public.identification_documents
  DROP CONSTRAINT IF EXISTS identification_documents_causa_discrepancia_check;
ALTER TABLE public.identification_documents
  ADD CONSTRAINT identification_documents_causa_discrepancia_check
  CHECK (
    causa_discrepancia IS NULL
    OR causa_discrepancia IN ('merma_humedad', 'evaporacion', 'tara_bascula', 'estimacion_origen', 'otro')
  );

ALTER TABLE public.identification_documents
  DROP CONSTRAINT IF EXISTS identification_documents_justificacion_discrepancia_check;
ALTER TABLE public.identification_documents
  ADD CONSTRAINT identification_documents_justificacion_discrepancia_check
  CHECK (
    justificacion_discrepancia IS NULL
    OR (char_length(btrim(justificacion_discrepancia)) BETWEEN 20 AND 2000 AND causa_discrepancia IS NOT NULL)
  );

COMMENT ON COLUMN public.identification_documents.justificacion_discrepancia IS
  'Justificación documental de la discrepancia de peso origen/destino (RD 553/2020).';

-- Permitir la nueva acción de auditoría 'justificar_discrepancia'
DO $$
DECLARE
  c RECORD;
BEGIN
  FOR c IN
    SELECT con.conname
    FROM pg_constraint con
    JOIN pg_class rel ON rel.oid = con.conrelid
    JOIN pg_namespace nsp ON nsp.oid = rel.relnamespace
    WHERE nsp.nspname = 'public'
      AND rel.relname = 'audit_logs'
      AND con.contype = 'c'
      AND pg_get_constraintdef(con.oid) ILIKE '%accion%'
  LOOP
    EXECUTE format('ALTER TABLE public.audit_logs DROP CONSTRAINT %I', c.conname);
  END LOOP;
END $$;

ALTER TABLE public.audit_logs
  ADD CONSTRAINT audit_logs_accion_check
  CHECK (accion IN (
    'crear', 'actualizar', 'eliminar', 'cambiar_estado', 'recepcionar_pesada',
    'registrar_incidencia', 'justificar_discrepancia', 'sincronizar_sira',
    'sincronizar_holded', 'exportar_archivo', 'descargar_pdf'
  ));
