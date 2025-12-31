-- =====================================================
-- WASTE MANAGEMENT DATABASE SCHEMA
-- Sistema de Gestión de Residuos (No Peligrosos/Peligrosos)
-- =====================================================

-- =====================================================
-- DROP EXISTING TABLES (in reverse order due to foreign keys)
-- =====================================================

DROP TABLE IF EXISTS public.annual_report_lines CASCADE;
DROP TABLE IF EXISTS public.annual_reports CASCADE;
DROP TABLE IF EXISTS public.identification_documents CASCADE;
DROP TABLE IF EXISTS public.waste_contracts CASCADE;
DROP TABLE IF EXISTS public.waste_types CASCADE;
DROP TABLE IF EXISTS public.companies CASCADE;

-- =====================================================
-- 1. COMPANIES TABLE (Empresas)
-- Almacena datos de las empresas (clientes, gestores, productores)
-- =====================================================

CREATE TABLE public.companies (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Datos básicos de la empresa
    razon_social VARCHAR(255) NOT NULL,
    nombre_comercial VARCHAR(255),
    cif VARCHAR(20) NOT NULL,
    
    -- Números de registro
    nima VARCHAR(50), -- Número de Identificación Medioambiental
    numero_inscripcion VARCHAR(100), -- Número de inscripción en registro
    
    -- Domicilios
    domicilio_social TEXT,
    codigo_postal_social VARCHAR(10),
    municipio_social VARCHAR(100),
    provincia_social VARCHAR(100),
    
    domicilio_instalacion TEXT,
    codigo_postal_instalacion VARCHAR(10),
    municipio_instalacion VARCHAR(100),
    provincia_instalacion VARCHAR(100),
    
    -- Contacto
    telefono VARCHAR(20),
    email VARCHAR(255),
    persona_contacto VARCHAR(255),
    
    -- Clasificación
    tipo_empresa VARCHAR(50) NOT NULL DEFAULT 'productor', 
    -- Valores: 'productor', 'gestor', 'transportista', 'negociante', 'agente'
    
    -- Logo y documentación
    logo_url TEXT,
    
    -- Metadata
    notas TEXT,
    activo BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT companies_cif_unique UNIQUE (cif, user_id)
);

-- Índices para companies
CREATE INDEX IF NOT EXISTS idx_companies_user_id ON public.companies(user_id);
CREATE INDEX IF NOT EXISTS idx_companies_tipo_empresa ON public.companies(tipo_empresa);
CREATE INDEX IF NOT EXISTS idx_companies_activo ON public.companies(activo);

-- =====================================================
-- 2. WASTE TYPES TABLE (Tipos de Residuos)
-- Catálogo de códigos LER y descripciones
-- =====================================================

CREATE TABLE public.waste_types (
    id BIGSERIAL PRIMARY KEY,
    
    -- Código LER (Lista Europea de Residuos)
    codigo_ler VARCHAR(20) NOT NULL UNIQUE,
    descripcion TEXT NOT NULL,
    
    -- Clasificación
    categoria VARCHAR(50) NOT NULL DEFAULT 'no-peligroso',
    -- Valores: 'no-peligroso', 'peligroso'
    
    estado VARCHAR(20) NOT NULL DEFAULT 'solido',
    -- Valores: 'solido', 'liquido', 'pastoso', 'gaseoso'
    
    -- Operaciones de tratamiento permitidas (códigos R y D)
    operaciones_permitidas TEXT[], -- Array de códigos como ['R1', 'R3', 'D1']
    
    -- Metadata
    activo BOOLEAN NOT NULL DEFAULT true,
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para waste_types
CREATE INDEX IF NOT EXISTS idx_waste_types_categoria ON public.waste_types(categoria);
CREATE INDEX IF NOT EXISTS idx_waste_types_codigo_ler ON public.waste_types(codigo_ler);

-- =====================================================
-- 3. WASTE CONTRACTS TABLE (Contratos de Tratamiento)
-- Contratos entre productores y gestores según RD 553/2020
-- =====================================================

CREATE TABLE public.waste_contracts (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Referencia a empresas
    company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    gestor_company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
    
    -- Datos del contrato
    numero_contrato VARCHAR(100),
    fecha_contrato DATE NOT NULL,
    fecha_inicio DATE,
    fecha_fin DATE,
    
    -- Tipo de contrato
    tipo_contrato VARCHAR(50) NOT NULL DEFAULT 'tratamiento',
    -- Valores: 'tratamiento', 'recogida', 'transporte', 'valoracion', 'eliminacion'
    
    -- Residuos cubiertos por el contrato
    waste_type_ids BIGINT[], -- Array de IDs de waste_types
    descripcion_residuos TEXT,
    
    -- Operaciones autorizadas
    operaciones_tratamiento TEXT[], -- Códigos R y D autorizados
    
    -- Condiciones del contrato
    cantidad_maxima_anual DECIMAL(15,2), -- En toneladas
    unidad_cantidad VARCHAR(20) DEFAULT 'toneladas',
    precio_unitario DECIMAL(10,2),
    moneda VARCHAR(10) DEFAULT 'EUR',
    
    -- Estado del contrato
    estado VARCHAR(20) NOT NULL DEFAULT 'vigente',
    -- Valores: 'borrador', 'vigente', 'finalizado', 'cancelado'
    
    -- Documentación
    documento_url TEXT, -- PDF del contrato firmado
    
    -- Metadata
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para waste_contracts
CREATE INDEX IF NOT EXISTS idx_waste_contracts_user_id ON public.waste_contracts(user_id);
CREATE INDEX IF NOT EXISTS idx_waste_contracts_company_id ON public.waste_contracts(company_id);
CREATE INDEX IF NOT EXISTS idx_waste_contracts_gestor_company_id ON public.waste_contracts(gestor_company_id);
CREATE INDEX IF NOT EXISTS idx_waste_contracts_estado ON public.waste_contracts(estado);
CREATE INDEX IF NOT EXISTS idx_waste_contracts_fecha_contrato ON public.waste_contracts(fecha_contrato);

-- =====================================================
-- 4. IDENTIFICATION DOCUMENTS TABLE (Documentos de Identificación)
-- Documentos de identificación de residuos (DI) - Sin notificación previa
-- =====================================================

CREATE TABLE public.identification_documents (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    
    -- Referencias
    contract_id BIGINT REFERENCES public.waste_contracts(id) ON DELETE SET NULL,
    company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Número del documento
    numero_documento VARCHAR(100) NOT NULL,
    fecha_documento DATE NOT NULL DEFAULT CURRENT_DATE,
    
    -- Tipo de notificación
    tipo_notificacion VARCHAR(50) NOT NULL DEFAULT 'sin-notificacion',
    -- Valores: 'sin-notificacion', 'con-notificacion-previa'
    
    -- DATOS DEL PRODUCTOR
    productor_razon_social VARCHAR(255) NOT NULL,
    productor_cif VARCHAR(20) NOT NULL,
    productor_nima VARCHAR(50),
    productor_direccion TEXT,
    productor_codigo_postal VARCHAR(10),
    productor_municipio VARCHAR(100),
    productor_provincia VARCHAR(100),
    productor_telefono VARCHAR(20),
    
    -- DATOS DEL GESTOR/DESTINATARIO
    gestor_razon_social VARCHAR(255) NOT NULL,
    gestor_cif VARCHAR(20) NOT NULL,
    gestor_nima VARCHAR(50),
    gestor_numero_autorizacion VARCHAR(100),
    gestor_direccion TEXT,
    gestor_codigo_postal VARCHAR(10),
    gestor_municipio VARCHAR(100),
    gestor_provincia VARCHAR(100),
    gestor_telefono VARCHAR(20),
    
    -- DATOS DEL TRANSPORTISTA (si es diferente)
    transportista_razon_social VARCHAR(255),
    transportista_cif VARCHAR(20),
    transportista_matricula VARCHAR(20),
    transportista_telefono VARCHAR(20),
    
    -- DATOS DEL RESIDUO
    waste_type_id BIGINT REFERENCES public.waste_types(id) ON DELETE SET NULL,
    codigo_ler VARCHAR(20) NOT NULL,
    descripcion_residuo TEXT NOT NULL,
    
    -- Características del residuo
    estado_fisico VARCHAR(20) NOT NULL DEFAULT 'solido',
    -- Valores: 'solido', 'liquido', 'pastoso', 'gaseoso'
    
    peligrosidad VARCHAR(20) NOT NULL DEFAULT 'no-peligroso',
    -- Valores: 'no-peligroso', 'peligroso'
    
    -- CANTIDAD
    cantidad DECIMAL(15,3) NOT NULL,
    unidad VARCHAR(20) NOT NULL DEFAULT 'kg',
    -- Valores: 'kg', 'toneladas', 'litros', 'm3', 'unidades'
    
    numero_envases INTEGER,
    tipo_envases VARCHAR(100), -- Ej: 'Contenedor 1000L', 'Big Bag', 'Bidón'
    
    -- TRATAMIENTO
    operacion_tratamiento VARCHAR(10), -- Código R o D (ej: 'R3', 'D1')
    descripcion_tratamiento TEXT,
    
    -- FECHAS
    fecha_recogida DATE,
    fecha_entrega DATE,
    
    -- FIRMAS Y VALIDACIÓN
    firmado_productor BOOLEAN DEFAULT false,
    firmado_gestor BOOLEAN DEFAULT false,
    firmado_transportista BOOLEAN DEFAULT false,
    
    fecha_firma_productor DATE,
    fecha_firma_gestor DATE,
    fecha_firma_transportista DATE,
    
    -- DOCUMENTACIÓN
    documento_url TEXT, -- PDF del DI firmado
    
    -- ESTADO
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador',
    -- Valores: 'borrador', 'pendiente-firma', 'completado', 'cancelado'
    
    -- Metadata
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT identification_documents_numero_documento_unique UNIQUE (numero_documento, user_id)
);

-- Índices para identification_documents
CREATE INDEX IF NOT EXISTS idx_identification_documents_user_id ON public.identification_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_identification_documents_company_id ON public.identification_documents(company_id);
CREATE INDEX IF NOT EXISTS idx_identification_documents_contract_id ON public.identification_documents(contract_id);
CREATE INDEX IF NOT EXISTS idx_identification_documents_waste_type_id ON public.identification_documents(waste_type_id);
CREATE INDEX IF NOT EXISTS idx_identification_documents_fecha_documento ON public.identification_documents(fecha_documento);
CREATE INDEX IF NOT EXISTS idx_identification_documents_estado ON public.identification_documents(estado);
CREATE INDEX IF NOT EXISTS idx_identification_documents_codigo_ler ON public.identification_documents(codigo_ler);

-- =====================================================
-- 5. ANNUAL REPORTS TABLE (Memorias Anuales)
-- Memorias anuales de residuos agregadas desde los DIs
-- =====================================================

CREATE TABLE public.annual_reports (
    id BIGSERIAL PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
    
    -- Año de la memoria
    anio INTEGER NOT NULL,
    
    -- Tipo de memoria según el rol de la empresa
    tipo_memoria VARCHAR(50) NOT NULL,
    -- Valores: 'productor', 'gestor', 'negociante', 'agente', 'transportista'
    
    -- Periodo
    fecha_inicio DATE NOT NULL,
    fecha_fin DATE NOT NULL,
    
    -- Estado
    estado VARCHAR(20) NOT NULL DEFAULT 'borrador',
    -- Valores: 'borrador', 'generado', 'presentado', 'validado'
    
    -- Resumen de cantidades
    total_residuos_generados DECIMAL(15,3),
    total_residuos_gestionados DECIMAL(15,3),
    unidad VARCHAR(20) DEFAULT 'toneladas',
    
    -- Documentación generada
    documento_excel_url TEXT, -- Excel de carga para SIRA
    documento_pdf_url TEXT, -- PDF resumen
    
    -- Metadata de presentación en SIRA
    fecha_presentacion DATE,
    numero_registro_sira VARCHAR(100),
    sira_presentado BOOLEAN DEFAULT false,
    
    -- Metadata
    notas TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    CONSTRAINT annual_reports_unique_year UNIQUE (company_id, anio, tipo_memoria)
);

-- Índices para annual_reports
CREATE INDEX IF NOT EXISTS idx_annual_reports_user_id ON public.annual_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_annual_reports_company_id ON public.annual_reports(company_id);
CREATE INDEX IF NOT EXISTS idx_annual_reports_anio ON public.annual_reports(anio);
CREATE INDEX IF NOT EXISTS idx_annual_reports_estado ON public.annual_reports(estado);

-- =====================================================
-- 6. ANNUAL REPORT LINES TABLE (Líneas de Memoria Anual)
-- Detalle de cada línea del Excel de memoria anual
-- =====================================================

CREATE TABLE public.annual_report_lines (
    id BIGSERIAL PRIMARY KEY,
    annual_report_id BIGINT NOT NULL REFERENCES public.annual_reports(id) ON DELETE CASCADE,
    
    -- Origen de los datos
    identification_document_ids BIGINT[], -- Array de IDs de DIs que generaron esta línea
    
    -- Datos del residuo
    codigo_ler VARCHAR(20) NOT NULL,
    descripcion_residuo TEXT NOT NULL,
    
    -- Origen/Destino
    origen_razon_social VARCHAR(255),
    origen_nima VARCHAR(50),
    destino_razon_social VARCHAR(255),
    destino_nima VARCHAR(50),
    
    -- Cantidades
    cantidad_total DECIMAL(15,3) NOT NULL,
    unidad VARCHAR(20) NOT NULL DEFAULT 'toneladas',
    numero_operaciones INTEGER, -- Número de DIs que sumaron esta cantidad
    
    -- Tratamiento
    operacion_tratamiento VARCHAR(10),
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para annual_report_lines
CREATE INDEX IF NOT EXISTS idx_annual_report_lines_annual_report_id ON public.annual_report_lines(annual_report_id);
CREATE INDEX IF NOT EXISTS idx_annual_report_lines_codigo_ler ON public.annual_report_lines(codigo_ler);

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_types ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waste_contracts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.identification_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.annual_report_lines ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- RLS POLICIES: COMPANIES
-- =====================================================

-- Users can view their own companies
CREATE POLICY "Users can view own companies" ON public.companies
    FOR SELECT USING (auth.uid() = companies.user_id);

-- Users can view gestor, transportista, negociante, and agente companies (shared resources)
CREATE POLICY "Users can view shared companies" ON public.companies
    FOR SELECT USING (companies.tipo_empresa IN ('gestor', 'transportista', 'negociante', 'agente'));

-- Users can insert their own companies
CREATE POLICY "Users can insert own companies" ON public.companies
    FOR INSERT WITH CHECK (auth.uid() = companies.user_id);

-- Users can update their own companies
CREATE POLICY "Users can update own companies" ON public.companies
    FOR UPDATE USING (auth.uid() = companies.user_id);

-- Users can delete their own companies
CREATE POLICY "Users can delete own companies" ON public.companies
    FOR DELETE USING (auth.uid() = companies.user_id);

-- =====================================================
-- RLS POLICIES: WASTE_TYPES (Tabla pública de referencia)
-- =====================================================

-- Everyone can view waste types
CREATE POLICY "Anyone can view waste types" ON public.waste_types
    FOR SELECT USING (true);

-- Only authenticated users can manage waste types
CREATE POLICY "Authenticated users can insert waste types" ON public.waste_types
    FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Authenticated users can update waste types" ON public.waste_types
    FOR UPDATE USING (auth.uid() IS NOT NULL);

-- =====================================================
-- RLS POLICIES: WASTE_CONTRACTS
-- =====================================================

-- Users can view their own contracts
CREATE POLICY "Users can view own contracts" ON public.waste_contracts
    FOR SELECT USING (auth.uid() = waste_contracts.user_id);

-- Users can insert their own contracts
CREATE POLICY "Users can insert own contracts" ON public.waste_contracts
    FOR INSERT WITH CHECK (auth.uid() = waste_contracts.user_id);

-- Users can update their own contracts
CREATE POLICY "Users can update own contracts" ON public.waste_contracts
    FOR UPDATE USING (auth.uid() = waste_contracts.user_id);

-- Users can delete their own contracts
CREATE POLICY "Users can delete own contracts" ON public.waste_contracts
    FOR DELETE USING (auth.uid() = waste_contracts.user_id);

-- =====================================================
-- RLS POLICIES: IDENTIFICATION_DOCUMENTS
-- =====================================================

-- Users can view their own documents
CREATE POLICY "Users can view own identification documents" ON public.identification_documents
    FOR SELECT USING (auth.uid() = identification_documents.user_id);

-- Users can insert their own documents
CREATE POLICY "Users can insert own identification documents" ON public.identification_documents
    FOR INSERT WITH CHECK (auth.uid() = identification_documents.user_id);

-- Users can update their own documents
CREATE POLICY "Users can update own identification documents" ON public.identification_documents
    FOR UPDATE USING (auth.uid() = identification_documents.user_id);

-- Users can delete their own documents
CREATE POLICY "Users can delete own identification documents" ON public.identification_documents
    FOR DELETE USING (auth.uid() = identification_documents.user_id);

-- =====================================================
-- RLS POLICIES: ANNUAL_REPORTS
-- =====================================================

-- Users can view their own annual reports
CREATE POLICY "Users can view own annual reports" ON public.annual_reports
    FOR SELECT USING (auth.uid() = annual_reports.user_id);

-- Users can insert their own annual reports
CREATE POLICY "Users can insert own annual reports" ON public.annual_reports
    FOR INSERT WITH CHECK (auth.uid() = annual_reports.user_id);

-- Users can update their own annual reports
CREATE POLICY "Users can update own annual reports" ON public.annual_reports
    FOR UPDATE USING (auth.uid() = annual_reports.user_id);

-- Users can delete their own annual reports
CREATE POLICY "Users can delete own annual reports" ON public.annual_reports
    FOR DELETE USING (auth.uid() = annual_reports.user_id);

-- =====================================================
-- RLS POLICIES: ANNUAL_REPORT_LINES
-- =====================================================

-- Users can view lines of their own reports
CREATE POLICY "Users can view own report lines" ON public.annual_report_lines
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.annual_reports
            WHERE annual_reports.id = annual_report_lines.annual_report_id
            AND annual_reports.user_id = auth.uid()
        )
    );

-- Users can insert lines to their own reports
CREATE POLICY "Users can insert own report lines" ON public.annual_report_lines
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.annual_reports
            WHERE annual_reports.id = annual_report_lines.annual_report_id
            AND annual_reports.user_id = auth.uid()
        )
    );

-- Users can update lines of their own reports
CREATE POLICY "Users can update own report lines" ON public.annual_report_lines
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM public.annual_reports
            WHERE annual_reports.id = annual_report_lines.annual_report_id
            AND annual_reports.user_id = auth.uid()
        )
    );

-- Users can delete lines from their own reports
CREATE POLICY "Users can delete own report lines" ON public.annual_report_lines
    FOR DELETE USING (
        EXISTS (
            SELECT 1 FROM public.annual_reports
            WHERE annual_reports.id = annual_report_lines.annual_report_id
            AND annual_reports.user_id = auth.uid()
        )
    );

-- =====================================================
-- TRIGGERS FOR UPDATED_AT
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for all tables
CREATE TRIGGER update_companies_updated_at BEFORE UPDATE ON public.companies
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waste_types_updated_at BEFORE UPDATE ON public.waste_types
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_waste_contracts_updated_at BEFORE UPDATE ON public.waste_contracts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_identification_documents_updated_at BEFORE UPDATE ON public.identification_documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annual_reports_updated_at BEFORE UPDATE ON public.annual_reports
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_annual_report_lines_updated_at BEFORE UPDATE ON public.annual_report_lines
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =====================================================
-- SEED DATA: Common Waste Types (Códigos LER más comunes)
-- =====================================================

INSERT INTO public.waste_types (codigo_ler, descripcion, categoria, estado, operaciones_permitidas, activo) VALUES
-- Residuos no peligrosos comunes
('15 01 01', 'Envases de papel y cartón', 'no-peligroso', 'solido', ARRAY['R3', 'R13'], true),
('15 01 02', 'Envases de plástico', 'no-peligroso', 'solido', ARRAY['R3', 'R13'], true),
('15 01 04', 'Envases metálicos', 'no-peligroso', 'solido', ARRAY['R4', 'R13'], true),
('15 01 06', 'Envases mezclados', 'no-peligroso', 'solido', ARRAY['R3', 'R13'], true),
('15 01 07', 'Envases de vidrio', 'no-peligroso', 'solido', ARRAY['R5', 'R13'], true),
('17 01 01', 'Hormigón', 'no-peligroso', 'solido', ARRAY['R5', 'R13'], true),
('17 01 02', 'Ladrillos', 'no-peligroso', 'solido', ARRAY['R5', 'R13'], true),
('17 01 03', 'Tejas y materiales cerámicos', 'no-peligroso', 'solido', ARRAY['R5', 'R13'], true),
('17 01 07', 'Mezclas de hormigón, ladrillos, tejas y materiales cerámicos', 'no-peligroso', 'solido', ARRAY['R5', 'R13'], true),
('17 02 01', 'Madera', 'no-peligroso', 'solido', ARRAY['R1', 'R3', 'R13'], true),
('17 02 02', 'Vidrio', 'no-peligroso', 'solido', ARRAY['R5', 'R13'], true),
('17 02 03', 'Plástico', 'no-peligroso', 'solido', ARRAY['R3', 'R13'], true),
('17 04 01', 'Cobre, bronce, latón', 'no-peligroso', 'solido', ARRAY['R4', 'R13'], true),
('17 04 02', 'Aluminio', 'no-peligroso', 'solido', ARRAY['R4', 'R13'], true),
('17 04 05', 'Hierro y acero', 'no-peligroso', 'solido', ARRAY['R4', 'R13'], true),
('17 04 07', 'Metales mezclados', 'no-peligroso', 'solido', ARRAY['R4', 'R13'], true),
('17 04 11', 'Cables distintos de los especificados en el código 17 04 10', 'no-peligroso', 'solido', ARRAY['R4', 'R13'], true),
('20 01 01', 'Papel y cartón', 'no-peligroso', 'solido', ARRAY['R3', 'R13'], true),
('20 01 08', 'Residuos biodegradables de cocinas y restaurantes', 'no-peligroso', 'solido', ARRAY['R3', 'R13'], true),
('20 01 39', 'Plásticos', 'no-peligroso', 'solido', ARRAY['R3', 'R13'], true),
('20 03 01', 'Mezclas de residuos municipales', 'no-peligroso', 'solido', ARRAY['R1', 'R13', 'D1'], true),

-- Residuos peligrosos comunes
('13 02 08*', 'Otros aceites de motor, de transmisión mecánica y lubricantes', 'peligroso', 'liquido', ARRAY['R1', 'R9', 'D10'], true),
('15 01 10*', 'Envases que contienen restos de sustancias peligrosas', 'peligroso', 'solido', ARRAY['R1', 'D10'], true),
('16 01 07*', 'Filtros de aceite', 'peligroso', 'solido', ARRAY['R1', 'D10'], true),
('17 02 04*', 'Vidrio, plástico y madera que contienen sustancias peligrosas', 'peligroso', 'solido', ARRAY['R1', 'D10'], true),
('17 03 01*', 'Mezclas bituminosas que contienen alquitrán de hulla', 'peligroso', 'solido', ARRAY['D1', 'D10'], true),
('17 05 03*', 'Tierra y piedras que contienen sustancias peligrosas', 'peligroso', 'solido', ARRAY['D1', 'D10'], true),
('17 06 01*', 'Materiales de aislamiento que contienen amianto', 'peligroso', 'solido', ARRAY['D5', 'D10'], true),
('20 01 21*', 'Tubos fluorescentes y otros residuos que contienen mercurio', 'peligroso', 'solido', ARRAY['R4', 'R13', 'D10'], true)
ON CONFLICT (codigo_ler) DO NOTHING;

-- =====================================================
-- COMENTARIOS Y DOCUMENTACIÓN
-- =====================================================

COMMENT ON TABLE public.companies IS 'Empresas registradas en el sistema (productores, gestores, transportistas, etc.)';
COMMENT ON TABLE public.waste_types IS 'Catálogo de tipos de residuos según códigos LER';
COMMENT ON TABLE public.waste_contracts IS 'Contratos de tratamiento de residuos según RD 553/2020';
COMMENT ON TABLE public.identification_documents IS 'Documentos de identificación de residuos (DI)';
COMMENT ON TABLE public.annual_reports IS 'Memorias anuales de residuos para presentación en SIRA';
COMMENT ON TABLE public.annual_report_lines IS 'Líneas de detalle de las memorias anuales';

-- =====================================================
-- FIN DEL SCRIPT
-- =====================================================
