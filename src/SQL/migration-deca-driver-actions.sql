-- ==============================================================================
-- RESIGEST 360 - EVIDENCIAS MÓVILES DEL CONDUCTOR EN DeCA Y CONFIGURACIÓN APP
-- ==============================================================================

ALTER TABLE public.deca_documents
  ADD COLUMN IF NOT EXISTS ticket_bascula_url TEXT,
  ADD COLUMN IF NOT EXISTS incidencia_movil TEXT,
  ADD COLUMN IF NOT EXISTS firma_conductor_url TEXT,
  ADD COLUMN IF NOT EXISTS fecha_firma_conductor TIMESTAMPTZ;

ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS app_config JSONB NOT NULL DEFAULT '{}'::jsonb;
