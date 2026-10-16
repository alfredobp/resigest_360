-- ==============================================================================
-- BLOQUE 8: MIGRACIÓN DE INTEGRACIONES OFICIALES Y GOBIERNO (SIRA / e3l, HOLDED Y AUDITORÍA)
-- Cumplimiento Ley 7/2022, RD 553/2020 y Plataforma Telemática SIRA (Junta de Andalucía)
-- ==============================================================================

-- 1. TABLA: sira_submissions (Cola y registro de transmisiones telemáticas E3L / SIRA)
CREATE TABLE IF NOT EXISTS public.sira_submissions (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE,
    identification_document_id BIGINT REFERENCES public.identification_documents(id) ON DELETE CASCADE,
    tipo_envio TEXT NOT NULL DEFAULT 'di' CHECK (tipo_envio IN ('di', 'notificacion_previa', 'memoria_anual')),
    estado TEXT NOT NULL DEFAULT 'enviado' CHECK (estado IN ('pendiente', 'enviado', 'aceptado', 'rechazado', 'error')),
    xml_enviado TEXT,
    xml_respuesta TEXT,
    codigo_acuse TEXT,
    mensaje_error TEXT,
    intentos INTEGER NOT NULL DEFAULT 1,
    ultimo_intento TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de búsqueda y rendimiento
CREATE INDEX IF NOT EXISTS idx_sira_submissions_di ON public.sira_submissions(identification_document_id);
CREATE INDEX IF NOT EXISTS idx_sira_submissions_company ON public.sira_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_sira_submissions_estado ON public.sira_submissions(estado);
CREATE INDEX IF NOT EXISTS idx_sira_submissions_created_at ON public.sira_submissions(created_at DESC);

-- RLS para envíos telemáticos
ALTER TABLE public.sira_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "sira_submissions_all_authenticated" ON public.sira_submissions
    FOR ALL USING (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.sira_submissions IS 'Histórico de envíos telemáticos e3l/SOAP a la plataforma SIRA con payloads XML y acuses';


-- 2. TABLA: audit_logs (Trazabilidad y pista de auditoría inmutable)
CREATE TABLE IF NOT EXISTS public.audit_logs (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE,
    entidad TEXT NOT NULL CHECK (entidad IN ('di', 'contrato', 'operacion_comercial', 'empresa', 'archivo_cronologico', 'memoria_anual', 'autorizacion', 'integracion_sira', 'integracion_holded')),
    entidad_id TEXT,
    accion TEXT NOT NULL CHECK (accion IN ('crear', 'actualizar', 'eliminar', 'cambiar_estado', 'recepcionar_pesada', 'registrar_incidencia', 'sincronizar_sira', 'sincronizar_holded', 'exportar_archivo', 'descargar_pdf')),
    detalles JSONB DEFAULT '{}'::jsonb,
    ip_address TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Índices de consulta de auditoría
CREATE INDEX IF NOT EXISTS idx_audit_logs_company ON public.audit_logs(company_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_entidad ON public.audit_logs(entidad, entidad_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs(created_at DESC);

-- RLS de auditoría
ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "audit_logs_select_authenticated" ON public.audit_logs
    FOR SELECT USING (auth.uid() IS NOT NULL);

CREATE POLICY "audit_logs_insert_authenticated" ON public.audit_logs
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

COMMENT ON TABLE public.audit_logs IS 'Trazabilidad y registro de auditoría legal de modificaciones críticas y llamadas a servicios oficiales';


-- 3. Trigger para actualizar updated_at en sira_submissions
CREATE OR REPLACE FUNCTION public.set_sira_submissions_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_sira_submissions_updated_at ON public.sira_submissions;
CREATE TRIGGER trg_sira_submissions_updated_at
    BEFORE UPDATE ON public.sira_submissions
    FOR EACH ROW
    EXECUTE FUNCTION public.set_sira_submissions_updated_at();
