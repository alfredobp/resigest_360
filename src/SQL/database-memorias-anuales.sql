-- =====================================================
-- TABLA: memorias_anuales
-- Descripción: Almacena las memorias anuales de residuos
-- =====================================================

-- Crear tabla
CREATE TABLE IF NOT EXISTS public.memorias_anuales (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  
  -- Datos básicos
  tipo_memoria TEXT NOT NULL CHECK (tipo_memoria IN ('productor', 'gestor', 'gestor_raee', 'negociante', 'transportista', 'agente')),
  año INTEGER NOT NULL,
  numero_memoria TEXT NOT NULL UNIQUE,
  
  -- Datos de la empresa
  nombre_empresa TEXT NOT NULL,
  nif_empresa TEXT NOT NULL,
  nombre_centro TEXT,
  municipio_centro TEXT,
  nima TEXT,
  
  -- Datos calculados
  total_movimientos INTEGER DEFAULT 0,
  total_toneladas DECIMAL(10,2) DEFAULT 0,
  fecha_inicio DATE NOT NULL,
  fecha_fin DATE NOT NULL,
  
  -- Resumen por código LER (JSON array)
  resumen_ler JSONB,
  
  -- Documentos de identificación incluidos (array de IDs)
  documentos_identificacion_ids INTEGER[] DEFAULT '{}',
  
  -- Estado y control
  estado TEXT NOT NULL DEFAULT 'borrador' CHECK (estado IN ('borrador', 'revision', 'completada', 'presentada', 'archivada')),
  fecha_presentacion TIMESTAMPTZ,
  observaciones TEXT,
  
  -- Archivos
  archivo_excel_url TEXT,
  archivo_pdf_url TEXT,
  
  -- Metadata
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Crear índices
CREATE INDEX IF NOT EXISTS idx_memorias_user_id ON public.memorias_anuales(user_id);
CREATE INDEX IF NOT EXISTS idx_memorias_company_id ON public.memorias_anuales(company_id);
CREATE INDEX IF NOT EXISTS idx_memorias_año ON public.memorias_anuales(año);
CREATE INDEX IF NOT EXISTS idx_memorias_tipo ON public.memorias_anuales(tipo_memoria);
CREATE INDEX IF NOT EXISTS idx_memorias_estado ON public.memorias_anuales(estado);
CREATE INDEX IF NOT EXISTS idx_memorias_numero ON public.memorias_anuales(numero_memoria);

-- Índice compuesto para búsquedas comunes
CREATE INDEX IF NOT EXISTS idx_memorias_user_año ON public.memorias_anuales(user_id, año);

-- =====================================================
-- ROW LEVEL SECURITY (RLS)
-- =====================================================

-- Habilitar RLS
ALTER TABLE public.memorias_anuales ENABLE ROW LEVEL SECURITY;

-- Política: Los usuarios solo pueden ver sus propias memorias
CREATE POLICY "Users can view own memorias"
  ON public.memorias_anuales
  FOR SELECT
  USING (auth.uid() = user_id);

-- Política: Los usuarios solo pueden crear sus propias memorias
CREATE POLICY "Users can create own memorias"
  ON public.memorias_anuales
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden actualizar sus propias memorias
CREATE POLICY "Users can update own memorias"
  ON public.memorias_anuales
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Política: Los usuarios solo pueden eliminar sus propias memorias
CREATE POLICY "Users can delete own memorias"
  ON public.memorias_anuales
  FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: Actualizar updated_at automáticamente
-- =====================================================

CREATE OR REPLACE FUNCTION update_memorias_anuales_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_memorias_anuales_updated_at
  BEFORE UPDATE ON public.memorias_anuales
  FOR EACH ROW
  EXECUTE FUNCTION update_memorias_anuales_updated_at();

-- =====================================================
-- COMENTARIOS
-- =====================================================

COMMENT ON TABLE public.memorias_anuales IS 'Memorias anuales de residuos generadas desde documentos de identificación';
COMMENT ON COLUMN public.memorias_anuales.tipo_memoria IS 'Tipo de memoria: productor, gestor, gestor_raee, negociante, transportista, agente';
COMMENT ON COLUMN public.memorias_anuales.numero_memoria IS 'Número único de memoria (ej: MA-2024-PROD-001)';
COMMENT ON COLUMN public.memorias_anuales.resumen_ler IS 'Resumen de movimientos por código LER en formato JSON';
COMMENT ON COLUMN public.memorias_anuales.documentos_identificacion_ids IS 'Array de IDs de documentos de identificación incluidos';
COMMENT ON COLUMN public.memorias_anuales.estado IS 'Estado: borrador, revision, completada, presentada, archivada';

-- =====================================================
-- DATOS DE EJEMPLO (OPCIONAL - Solo para desarrollo)
-- =====================================================

-- Nota: Descomentar solo si necesitas datos de prueba
/*
INSERT INTO public.memorias_anuales (
  user_id,
  company_id,
  tipo_memoria,
  año,
  numero_memoria,
  nombre_empresa,
  nif_empresa,
  fecha_inicio,
  fecha_fin,
  total_movimientos,
  total_toneladas,
  estado
) VALUES (
  'your-user-id-here', -- Reemplazar con un user_id válido
  1,
  'productor',
  2024,
  'MA-2024-PROD-001',
  'Empresa Ejemplo S.L.',
  'B12345678',
  '2024-01-01',
  '2024-12-31',
  25,
  150.50,
  'borrador'
);
*/

-- =====================================================
-- GRANT PERMISSIONS (si es necesario)
-- =====================================================

-- Dar permisos al usuario autenticado
GRANT SELECT, INSERT, UPDATE, DELETE ON public.memorias_anuales TO authenticated;
GRANT USAGE, SELECT ON SEQUENCE memorias_anuales_id_seq TO authenticated;
