-- ==============================================================================
-- RESIGEST 360 - MIGRACIÓN: OPERACIONES COMERCIALES (NEGOCIANTE Y AGENTE)
-- ==============================================================================
-- Esta migración implementa la entidad central de Operación Comercial para
-- Negociantes y Agentes de Residuos (Arts. 23 y 24 Ley 7/2022), permitiendo
-- desacoplar el flujo físico (Productor -> Transportista -> Gestor) del
-- flujo económico (Proveedor -> Porte Logístico -> Cliente) y calcular márgenes.

CREATE TABLE IF NOT EXISTS public.commercial_operations (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,

  -- Identificador correlativo oficial
  numero_operacion TEXT NOT NULL UNIQUE,
  fecha DATE NOT NULL DEFAULT CURRENT_DATE,

  -- Estado operativo y de liquidación
  estado TEXT NOT NULL DEFAULT 'abierta' CHECK (
    estado IN ('borrador', 'abierta', 'en_transito', 'completada', 'liquidada', 'cancelada')
  ),

  -- -------------------------------------------------------------
  -- 1. FLUJO FÍSICO DE LOS RESIDUOS (TRAZABILIDAD AMBIENTAL)
  -- -------------------------------------------------------------
  origen_productor_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  origen_center_id BIGINT REFERENCES public.production_centers(id) ON DELETE SET NULL,
  origen_nombre_personalizado TEXT,
  origen_nima TEXT,
  origen_cif TEXT,

  destino_gestor_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  destino_nombre_personalizado TEXT,
  destino_nima TEXT,
  destino_cif TEXT,
  destino_autorizacion TEXT,

  transportista_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  transportista_nombre_personalizado TEXT,
  transportista_cif TEXT,
  transportista_matricula TEXT,

  -- Residuo
  codigo_ler TEXT NOT NULL,
  descripcion_residuo TEXT NOT NULL,
  peligrosidad TEXT NOT NULL DEFAULT 'no-peligroso' CHECK (peligrosidad IN ('no-peligroso', 'peligroso')),
  operacion_rd TEXT, -- R01, R13, D10, D15...

  -- Magnitudes físicas
  cantidad_estimada_t NUMERIC(12, 3) NOT NULL DEFAULT 0,
  cantidad_real_t NUMERIC(12, 3) DEFAULT 0,

  -- Documentación ambiental vinculada
  identification_document_id BIGINT REFERENCES public.identification_documents(id) ON DELETE SET NULL,
  numero_albaran_gestor TEXT,

  -- -------------------------------------------------------------
  -- 2. FLUJO COMERCIAL DE COMPRA / ENTRADA
  -- -------------------------------------------------------------
  proveedor_comercial_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  proveedor_razon_social TEXT,
  proveedor_cif TEXT,
  tipo_precio_compra TEXT NOT NULL DEFAULT 'por_tonelada' CHECK (tipo_precio_compra IN ('por_tonelada', 'lote_fijo', 'por_kg')),
  precio_unitario_compra NUMERIC(10, 2) NOT NULL DEFAULT 0,
  coste_compra_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  factura_compra_ref TEXT,
  estado_pago_compra TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_pago_compra IN ('pendiente', 'pagado', 'no_aplica')),

  -- -------------------------------------------------------------
  -- 3. FLUJO COMERCIAL DE VENTA / SALIDA
  -- -------------------------------------------------------------
  cliente_comercial_id BIGINT REFERENCES public.companies(id) ON DELETE SET NULL,
  cliente_razon_social TEXT,
  cliente_cif TEXT,
  tipo_precio_venta TEXT NOT NULL DEFAULT 'por_tonelada' CHECK (tipo_precio_venta IN ('por_tonelada', 'lote_fijo', 'por_kg')),
  precio_unitario_venta NUMERIC(10, 2) NOT NULL DEFAULT 0,
  ingreso_venta_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  factura_venta_ref TEXT,
  estado_cobro_venta TEXT NOT NULL DEFAULT 'pendiente' CHECK (estado_cobro_venta IN ('pendiente', 'cobrado', 'no_aplica')),

  -- -------------------------------------------------------------
  -- 4. COSTES LOGÍSTICOS Y ACCESORIOS
  -- -------------------------------------------------------------
  coste_transporte NUMERIC(10, 2) NOT NULL DEFAULT 0,
  otros_costes NUMERIC(10, 2) NOT NULL DEFAULT 0,
  descripcion_otros_costes TEXT,

  -- -------------------------------------------------------------
  -- 5. RENTABILIDAD Y MÁRGENES (CÁLCULO FINANCIERO)
  -- -------------------------------------------------------------
  -- Margen Bruto = Ingreso Venta - Coste Compra - Transporte - Otros
  margen_bruto_total NUMERIC(12, 2) NOT NULL DEFAULT 0,
  margen_unitario_tonelada NUMERIC(10, 2) NOT NULL DEFAULT 0,
  porcentaje_margen NUMERIC(6, 2) NOT NULL DEFAULT 0,

  observaciones TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices de alto rendimiento
CREATE INDEX IF NOT EXISTS idx_commercial_ops_user_id ON public.commercial_operations(user_id);
CREATE INDEX IF NOT EXISTS idx_commercial_ops_company_id ON public.commercial_operations(company_id);
CREATE INDEX IF NOT EXISTS idx_commercial_ops_fecha ON public.commercial_operations(fecha);
CREATE INDEX IF NOT EXISTS idx_commercial_ops_estado ON public.commercial_operations(estado);
CREATE INDEX IF NOT EXISTS idx_commercial_ops_di_id ON public.commercial_operations(identification_document_id);
CREATE INDEX IF NOT EXISTS idx_commercial_ops_proveedor ON public.commercial_operations(proveedor_comercial_id);
CREATE INDEX IF NOT EXISTS idx_commercial_ops_cliente ON public.commercial_operations(cliente_comercial_id);

-- Habilitar Row Level Security
ALTER TABLE public.commercial_operations ENABLE ROW LEVEL SECURITY;

-- Políticas de RLS
CREATE POLICY "Users can view own commercial operations"
  ON public.commercial_operations
  FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create own commercial operations"
  ON public.commercial_operations
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own commercial operations"
  ON public.commercial_operations
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own commercial operations"
  ON public.commercial_operations
  FOR DELETE
  USING (auth.uid() = user_id);

-- Trigger de updated_at
CREATE OR REPLACE FUNCTION update_commercial_operations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_commercial_operations_updated_at ON public.commercial_operations;
CREATE TRIGGER trigger_update_commercial_operations_updated_at
  BEFORE UPDATE ON public.commercial_operations
  FOR EACH ROW
  EXECUTE FUNCTION update_commercial_operations_updated_at();
