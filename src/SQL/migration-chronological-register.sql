-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN: ARCHIVO CRONOLÓGICO OBLIGATORIO (ART. 64 LEY 7/2022)
-- ==============================================================================
-- Esta migración implementa la estructura exigida por el Artículo 64 de la Ley 7/2022,
-- de 8 de abril, de residuos y suelos contaminados para una economía circular,
-- garantizando la conservación de registros por al menos 5 años con trazabilidad
-- documental hacia los Documentos de Identificación (RD 553/2020) y cálculo
-- de memorias anuales de gestores y productores.

CREATE TABLE IF NOT EXISTS public.chronological_registry (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  production_center_id BIGINT REFERENCES public.production_centers(id) ON DELETE SET NULL,

  -- Identificador de asiento correlativo
  numero_asiento TEXT NOT NULL,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Tipo de movimiento o anotación
  -- 'produccion_interna': Generación del residuo en el centro productor
  -- 'salida_traslado': Envío del residuo a un gestor de destino (amparado por DI)
  -- 'entrada_recepcion': Recepción de residuo por una instalación gestora
  -- 'tratamiento_interno': Operación de valorización/eliminación en la propia planta
  -- 'merma_ajuste': Regularización justificada de inventario/stock
  tipo_operacion TEXT NOT NULL CHECK (
    tipo_operacion IN (
      'produccion_interna',
      'salida_traslado',
      'entrada_recepcion',
      'tratamiento_interno',
      'merma_ajuste'
    )
  ),

  -- Clasificación del Residuo
  codigo_ler TEXT NOT NULL,
  descripcion_residuo TEXT NOT NULL,
  peligrosidad TEXT NOT NULL DEFAULT 'no-peligroso' CHECK (peligrosidad IN ('no-peligroso', 'peligroso')),
  codigo_hp TEXT[], -- Códigos de características de peligrosidad HP1-HP15
  estado_fisico TEXT CHECK (estado_fisico IN ('solido', 'liquido', 'pastoso', 'gaseoso')),

  -- Magnitudes
  cantidad_kg NUMERIC(14, 3) NOT NULL CHECK (cantidad_kg >= 0),
  cantidad_t NUMERIC(14, 3) GENERATED ALWAYS AS (ROUND(cantidad_kg / 1000.0, 3)) STORED,
  envase_tipo TEXT,
  envase_unidades INTEGER,

  -- Procedencia / Origen del Residuo
  origen_tipo TEXT DEFAULT 'propio', -- 'propio', 'tercero_productor', 'tercero_gestor'
  origen_nif TEXT,
  origen_razon_social TEXT,
  origen_nima TEXT,
  origen_direccion TEXT,
  origen_municipio TEXT,
  origen_provincia TEXT,

  -- Transportista Interviniente
  transportista_nif TEXT,
  transportista_razon_social TEXT,
  transportista_nima TEXT,
  transportista_matricula TEXT,

  -- Destino / Gestor
  destino_tipo TEXT DEFAULT 'tercero_gestor', -- 'propio_tratamiento', 'tercero_gestor'
  destino_nif TEXT,
  destino_razon_social TEXT,
  destino_nima TEXT,
  destino_autorizacion TEXT,
  destino_direccion TEXT,
  destino_municipio TEXT,
  destino_provincia TEXT,

  -- Operación de Tratamiento Prevista o Efectuada (R o D)
  operacion_rd TEXT, -- Ej: R01, R13, D01, D10, D15
  operacion_rd_descripcion TEXT,

  -- Vínculo documental
  identification_document_id BIGINT REFERENCES public.identification_documents(id) ON DELETE SET NULL,
  numero_documento_referencia TEXT, -- Nº de DI, Albarán gestor o ticket de báscula

  observaciones TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas y filtros frecuentes
CREATE INDEX IF NOT EXISTS idx_chronological_user_id ON public.chronological_registry(user_id);
CREATE INDEX IF NOT EXISTS idx_chronological_company_id ON public.chronological_registry(company_id);
CREATE INDEX IF NOT EXISTS idx_chronological_center_id ON public.chronological_registry(production_center_id);
CREATE INDEX IF NOT EXISTS idx_chronological_fecha ON public.chronological_registry(fecha);
CREATE INDEX IF NOT EXISTS idx_chronological_ler ON public.chronological_registry(codigo_ler);
CREATE INDEX IF NOT EXISTS idx_chronological_tipo_op ON public.chronological_registry(tipo_operacion);
CREATE INDEX IF NOT EXISTS idx_chronological_di_id ON public.chronological_registry(identification_document_id);

-- Habilitar Row Level Security
ALTER TABLE public.chronological_registry ENABLE ROW LEVEL SECURITY;

-- Políticas de Seguridad RLS
CREATE POLICY "Users can view own chronological entries"
  ON public.chronological_registry
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own chronological entries"
  ON public.chronological_registry
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own chronological entries"
  ON public.chronological_registry
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own chronological entries"
  ON public.chronological_registry
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_chronological_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_chronological_updated_at ON public.chronological_registry;
CREATE TRIGGER trigger_update_chronological_updated_at
  BEFORE UPDATE ON public.chronological_registry
  FOR EACH ROW
  EXECUTE FUNCTION update_chronological_updated_at();

-- ==============================================================================
-- POBLADO INICIAL IDEMPOTENTE: Sincronizar DIs completados o cerrados
-- ==============================================================================
INSERT INTO public.chronological_registry (
  user_id,
  company_id,
  production_center_id,
  numero_asiento,
  fecha,
  tipo_operacion,
  codigo_ler,
  descripcion_residuo,
  peligrosidad,
  estado_fisico,
  cantidad_kg,
  envase_tipo,
  envase_unidades,
  origen_tipo,
  origen_nif,
  origen_razon_social,
  origen_nima,
  origen_direccion,
  origen_municipio,
  origen_provincia,
  transportista_nif,
  transportista_razon_social,
  transportista_nima,
  transportista_matricula,
  destino_tipo,
  destino_nif,
  destino_razon_social,
  destino_nima,
  destino_autorizacion,
  destino_direccion,
  destino_municipio,
  destino_provincia,
  operacion_rd,
  identification_document_id,
  numero_documento_referencia,
  observaciones
)
SELECT
  di.user_id,
  di.company_id,
  di.production_center_id,
  'AS-' || TO_CHAR(COALESCE(di.fecha_entrega::date, di.fecha_documento::date, CURRENT_DATE), 'YYYY') || '-' || LPAD(di.id::text, 6, '0'),
  COALESCE(di.fecha_entrega::date, di.fecha_salida::date, di.fecha_documento::date, CURRENT_DATE),
  'salida_traslado',
  di.codigo_ler,
  di.descripcion_residuo,
  di.peligrosidad,
  di.estado_fisico,
  COALESCE(di.peso_destino_kg, di.peso_origen_kg, (di.cantidad * 1000.0), 0),
  di.tipo_envases,
  di.numero_envases,
  'propio',
  di.productor_cif,
  di.productor_razon_social,
  di.productor_nima,
  di.productor_direccion,
  di.productor_municipio,
  di.productor_provincia,
  di.transportista_cif,
  di.transportista_razon_social,
  di.transportista_nima,
  di.transportista_matricula,
  'tercero_gestor',
  di.gestor_cif,
  di.gestor_razon_social,
  di.gestor_nima,
  di.gestor_numero_autorizacion,
  di.gestor_direccion,
  di.gestor_municipio,
  di.gestor_provincia,
  di.operacion_tratamiento,
  di.id,
  COALESCE(di.numero_albaran_gestor, di.numero_documento),
  'Asiento generado automáticamente a partir del Documento de Identificación ' || di.numero_documento
FROM public.identification_documents di
WHERE (di.estado IN ('completado', 'aceptado', 'tratado') OR di.estado_traslado IN ('entregado', 'aceptado_en_destino', 'tratado_cerrado'))
  AND NOT EXISTS (
    SELECT 1 FROM public.chronological_registry cr
    WHERE cr.identification_document_id = di.id
  );
