-- ==============================================================================
-- RESIGEST 360 - MÓDULO DE FLOTA Y CONDUCTORES (MODO TRANSPORTISTA)
-- Incluye tablas dedicadas para vehículos propios, conductores y soporte de
-- evidencias/tickets de báscula en DeCA.
-- ==============================================================================

-- 1. Vehículos propios de la flota
CREATE TABLE IF NOT EXISTS public.fleet_vehicles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL CHECK (tipo IN ('tractora', 'remolque', 'rigido', 'cisterna')),
  matricula VARCHAR(20) NOT NULL,
  marca_modelo VARCHAR(150),
  tara_kg NUMERIC(10, 2),
  mma_kg NUMERIC(10, 2),
  adr_habilitado BOOLEAN NOT NULL DEFAULT false,
  adr_caducidad DATE,
  itv_caducidad DATE,
  seguro_caducidad DATE,
  autorizacion_transporte VARCHAR(100),
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_user_id ON public.fleet_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_vehicles_matricula ON public.fleet_vehicles(matricula);

ALTER TABLE public.fleet_vehicles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own fleet vehicles" ON public.fleet_vehicles;
CREATE POLICY "Users can manage own fleet vehicles"
  ON public.fleet_vehicles
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 2. Conductores propios
CREATE TABLE IF NOT EXISTS public.fleet_drivers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  nombre_completo VARCHAR(150) NOT NULL,
  dni VARCHAR(20) NOT NULL,
  telefono VARCHAR(30),
  pin_acceso VARCHAR(10),
  adr_habilitado BOOLEAN NOT NULL DEFAULT false,
  adr_caducidad DATE,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_fleet_drivers_user_id ON public.fleet_drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_fleet_drivers_dni ON public.fleet_drivers(dni);

ALTER TABLE public.fleet_drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage own fleet drivers" ON public.fleet_drivers;
CREATE POLICY "Users can manage own fleet drivers"
  ON public.fleet_drivers
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Columnas opcionales en DeCA para evidencias móviles (ticket de báscula / incidencia)
ALTER TABLE public.deca_documents
  ADD COLUMN IF NOT EXISTS ticket_bascula_url TEXT,
  ADD COLUMN IF NOT EXISTS incidencia_movil TEXT,
  ADD COLUMN IF NOT EXISTS firma_conductor_url TEXT,
  ADD COLUMN IF NOT EXISTS fecha_firma_conductor TIMESTAMPTZ;
