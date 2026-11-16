-- ==============================================================================
-- MIGRACIÓN: MÓDULO DE NOTIFICACIONES PREVIAS (NT) E INTEGRACIÓN SIRA
-- Real Decreto 553/2020 y Sistema de Información de Residuos de Andalucía (SIRA)
-- ==============================================================================

-- 1. Tabla de Notificaciones Previas
CREATE TABLE IF NOT EXISTS public.prior_notifications (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  production_center_id BIGINT REFERENCES public.production_centers(id) ON DELETE SET NULL,

  numero_notificacion TEXT NOT NULL,
  tipo_notificacion TEXT NOT NULL DEFAULT 'general' CHECK (tipo_notificacion IN ('general', 'individual')),
  tipo_traslado TEXT NOT NULL DEFAULT 'autonomico' CHECK (tipo_traslado IN ('autonomico', 'interautonomico')),
  numero_traslados_previstos INTEGER DEFAULT 1,

  fecha_notificacion DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_inicio DATE NOT NULL DEFAULT CURRENT_DATE,
  fecha_fin DATE NOT NULL,

  -- Operador del traslado
  operador_cif TEXT NOT NULL,
  operador_razon_social TEXT NOT NULL,
  operador_nima TEXT,
  operador_direccion TEXT,
  operador_municipio TEXT,
  operador_provincia TEXT,
  operador_codigo_postal TEXT,
  operador_telefono TEXT,
  operador_email TEXT,

  -- Productor / Centro de origen
  productor_cif TEXT NOT NULL,
  productor_razon_social TEXT NOT NULL,
  productor_nima TEXT,
  productor_direccion TEXT,
  productor_municipio TEXT,
  productor_provincia TEXT,
  productor_codigo_postal TEXT,
  productor_telefono TEXT,
  productor_email TEXT,

  -- Gestor / Instalación de destino
  gestor_cif TEXT NOT NULL,
  gestor_razon_social TEXT NOT NULL,
  gestor_nima TEXT,
  gestor_numero_autorizacion TEXT,
  gestor_direccion TEXT,
  gestor_municipio TEXT,
  gestor_provincia TEXT,
  gestor_codigo_postal TEXT,
  gestor_telefono TEXT,
  gestor_email TEXT,

  -- Transportista
  transportista_cif TEXT,
  transportista_razon_social TEXT,
  transportista_nima TEXT,
  transportista_direccion TEXT,
  transportista_municipio TEXT,
  transportista_provincia TEXT,
  transportista_codigo_postal TEXT,
  transportista_telefono TEXT,
  transportista_email TEXT,

  -- Residuo
  codigo_ler TEXT NOT NULL,
  descripcion_residuo TEXT NOT NULL,
  peligrosidad TEXT NOT NULL DEFAULT 'no-peligroso' CHECK (peligrosidad IN ('no-peligroso', 'peligroso')),
  operacion_tratamiento TEXT NOT NULL DEFAULT 'R13',
  estado_fisico TEXT NOT NULL DEFAULT 'solido' CHECK (estado_fisico IN ('solido', 'liquido', 'pastoso', 'gaseoso')),
  caracteristica_peligrosidad TEXT,
  cantidad_estimada_kg NUMERIC(12,3) NOT NULL DEFAULT 1000.000,

  -- Integración telemática SIRA
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'validada_sira', 'enviada_sira', 'aceptada', 'rechazada', 'caducada')),
  sira_id TEXT,
  sira_envio_fecha TIMESTAMPTZ,
  sira_error_detalles TEXT,
  notas TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Índices de rendimiento y multi-tenancy
CREATE INDEX IF NOT EXISTS idx_prior_notifications_user_id ON public.prior_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_prior_notifications_company_id ON public.prior_notifications(company_id);
CREATE INDEX IF NOT EXISTS idx_prior_notifications_numero_notificacion ON public.prior_notifications(numero_notificacion);
CREATE INDEX IF NOT EXISTS idx_prior_notifications_estado ON public.prior_notifications(estado);

-- 3. Habilitar RLS
ALTER TABLE public.prior_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS prior_notifications_user_isolation ON public.prior_notifications;
CREATE POLICY prior_notifications_user_isolation ON public.prior_notifications
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 4. Ampliar identification_documents con vínculo a Notificación Previa
ALTER TABLE public.identification_documents
  ADD COLUMN IF NOT EXISTS prior_notification_id BIGINT REFERENCES public.prior_notifications(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS numero_notificacion TEXT;

CREATE INDEX IF NOT EXISTS idx_identification_documents_prior_notification_id
  ON public.identification_documents(prior_notification_id);

-- 5. Actualizar constraints para permitir todos los ámbitos
ALTER TABLE public.prior_notifications DROP CONSTRAINT IF EXISTS prior_notifications_tipo_traslado_check;
ALTER TABLE public.prior_notifications ADD CONSTRAINT prior_notifications_tipo_traslado_check 
  CHECK (tipo_traslado IN ('autonomico', 'interautonomico', 'nacional', 'intracomunitario'));

ALTER TABLE public.prior_notifications DROP CONSTRAINT IF EXISTS prior_notifications_tipo_notificacion_check;
ALTER TABLE public.prior_notifications ADD CONSTRAINT prior_notifications_tipo_notificacion_check 
  CHECK (tipo_notificacion IN ('general', 'individual', 'puntual'));

-- 6. Comentarios
COMMENT ON TABLE public.prior_notifications IS 'Notificaciones Previas de Traslado de Residuos (RD 553/2020 y SIRA E3L 3.3).';
COMMENT ON COLUMN public.identification_documents.numero_notificacion IS 'Número oficial de Notificación Previa asignado por SIRA/e-SIR o indicado por el operador.';

