-- ==============================================================================
-- RESIGEST 360 - MÓDULO DeCA (DOCUMENTO ELECTRÓNICO DE CONTROL ADMINISTRATIVO)
-- Normativa: Ley 9/2025 de Movilidad Sostenible (DT 8ª), Orden FOM/2861/2012,
-- Resolución de 5 de junio de 2026, RD 553/2020 y Ley 7/2022.
-- ==============================================================================

-- 1. Tabla principal de documentos DeCA
CREATE TABLE IF NOT EXISTS public.deca_documents (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
    identification_document_id BIGINT REFERENCES public.identification_documents(id) ON DELETE SET NULL,
    
    -- Identificación del documento y serie
    numero_deca VARCHAR(50) NOT NULL,
    version INTEGER NOT NULL DEFAULT 1,
    is_vigente BOOLEAN NOT NULL DEFAULT TRUE,
    previous_version_id BIGINT REFERENCES public.deca_documents(id) ON DELETE SET NULL,
    CONSTRAINT deca_documents_numero_version_key UNIQUE (numero_deca, version),
    
    -- Token criptográfico único para inspección y QR
    token VARCHAR(64) NOT NULL UNIQUE,
    pdf_url TEXT,
    
    -- 1. Cargador Contractual (Art. 3 Orden FOM/2861/2012)
    cargador_razon_social VARCHAR(255) NOT NULL,
    cargador_nif VARCHAR(20) NOT NULL,
    cargador_domicilio TEXT NOT NULL,
    cargador_codigo_postal VARCHAR(10),
    cargador_municipio VARCHAR(100),
    cargador_provincia VARCHAR(100),
    
    -- 2. Transportista Efectivo (Art. 3 Orden FOM/2861/2012)
    transportista_razon_social VARCHAR(255) NOT NULL,
    transportista_nif VARCHAR(20) NOT NULL,
    transportista_domicilio TEXT,
    transportista_codigo_postal VARCHAR(10),
    transportista_municipio VARCHAR(100),
    transportista_provincia VARCHAR(100),
    transportista_nima VARCHAR(20),
    transportista_autorizacion VARCHAR(100),
    
    -- 3. Lugares de Origen y Destino
    origen_direccion TEXT NOT NULL,
    origen_codigo_postal VARCHAR(10),
    origen_municipio VARCHAR(100) NOT NULL,
    origen_provincia VARCHAR(100) NOT NULL,
    origen_nima VARCHAR(20),
    
    destino_direccion TEXT NOT NULL,
    destino_codigo_postal VARCHAR(10),
    destino_municipio VARCHAR(100) NOT NULL,
    destino_provincia VARCHAR(100) NOT NULL,
    destino_nima VARCHAR(20),
    
    -- 4. Mercancía Transportada
    naturaleza_mercancia TEXT NOT NULL,
    peso_kg NUMERIC(12, 3),
    magnitud_alternativa VARCHAR(100),
    codigo_ler VARCHAR(20),
    descripcion_ler TEXT,
    numero_di VARCHAR(50),
    numero_nt VARCHAR(50),
    es_residuo_peligroso BOOLEAN DEFAULT FALSE,
    requiere_adr BOOLEAN DEFAULT FALSE,
    materia_adr VARCHAR(255),
    
    -- 5. Vehículo y Conductor
    matricula_tractora VARCHAR(20) NOT NULL,
    matricula_remolque VARCHAR(20),
    autorizacion_especial VARCHAR(100),
    conductor_nombre VARCHAR(150),
    conductor_dni VARCHAR(20),
    conductor_telefono VARCHAR(30),
    
    -- 6. Fechas y Horas del Servicio
    fecha_transporte DATE NOT NULL DEFAULT CURRENT_DATE,
    hora_salida TIME,
    hora_cierre TIME,
    fecha_finalizacion TIMESTAMP WITH TIME ZONE,
    
    -- 7. Estado y Observaciones
    estado VARCHAR(30) NOT NULL DEFAULT 'vigente', -- 'borrador', 'vigente', 'en_transito', 'finalizado', 'anulado'
    motivo_exclusion TEXT,
    observaciones_reservas TEXT,
    
    -- Metadatos y Auditoría
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Índices de consulta rápida y unicidad
CREATE INDEX IF NOT EXISTS idx_deca_user_id ON public.deca_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_deca_company_id ON public.deca_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_deca_token ON public.deca_documents(token);
CREATE INDEX IF NOT EXISTS idx_deca_fecha_transporte ON public.deca_documents(fecha_transporte);
CREATE INDEX IF NOT EXISTS idx_deca_estado ON public.deca_documents(estado);
CREATE INDEX IF NOT EXISTS idx_deca_di_id ON public.deca_documents(identification_document_id);

-- 2. Tabla de Auditoría y Trazabilidad de Versiones (Art. 4.4 de la Especificación)
CREATE TABLE IF NOT EXISTS public.deca_audit_logs (
    id BIGSERIAL PRIMARY KEY,
    deca_id BIGINT NOT NULL REFERENCES public.deca_documents(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    accion VARCHAR(50) NOT NULL, -- 'creacion', 'modificacion_version', 'cambio_estado', 'inspeccion_descarga', 'finalizacion'
    version_resultante INTEGER NOT NULL DEFAULT 1,
    detalles JSONB,
    ip_origen VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_deca_audit_deca_id ON public.deca_audit_logs(deca_id);

-- 3. Row Level Security (RLS)
ALTER TABLE public.deca_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.deca_audit_logs ENABLE ROW LEVEL SECURITY;

-- Políticas para deca_documents
-- Permite lectura pública para que la inspección en carretera (Guardia Civil) descargue el documento por token sin login
DROP POLICY IF EXISTS "Los usuarios pueden ver los DeCA de su cuenta" ON public.deca_documents;
DROP POLICY IF EXISTS "Permitir lectura publica por token" ON public.deca_documents;
CREATE POLICY "Permitir lectura publica por token"
    ON public.deca_documents FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Los usuarios pueden insertar DeCA en su cuenta" ON public.deca_documents;
CREATE POLICY "Los usuarios pueden insertar DeCA en su cuenta"
    ON public.deca_documents FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden actualizar DeCA de su cuenta" ON public.deca_documents;
CREATE POLICY "Los usuarios pueden actualizar DeCA de su cuenta"
    ON public.deca_documents FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Los usuarios pueden eliminar DeCA de su cuenta" ON public.deca_documents;
CREATE POLICY "Los usuarios pueden eliminar DeCA de su cuenta"
    ON public.deca_documents FOR DELETE
    USING (auth.uid() = user_id);

-- Políticas para deca_audit_logs
DROP POLICY IF EXISTS "Los usuarios pueden ver auditorias de sus DeCA" ON public.deca_audit_logs;
CREATE POLICY "Los usuarios pueden ver auditorias de sus DeCA"
    ON public.deca_audit_logs FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM public.deca_documents d
            WHERE d.id = deca_audit_logs.deca_id AND d.user_id = auth.uid()
        )
    );

DROP POLICY IF EXISTS "Permitir inserción de logs de auditoria" ON public.deca_audit_logs;
CREATE POLICY "Permitir inserción de logs de auditoria"
    ON public.deca_audit_logs FOR INSERT
    WITH CHECK (true);

-- 4. Actualización de restricción para tablas existentes (permite versiones múltiples de un mismo DeCA)
DO $$
BEGIN
    ALTER TABLE public.deca_documents DROP CONSTRAINT IF EXISTS deca_documents_numero_deca_key;
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'deca_documents_numero_version_key') THEN
        ALTER TABLE public.deca_documents ADD CONSTRAINT deca_documents_numero_version_key UNIQUE (numero_deca, version);
    END IF;
END $$;
