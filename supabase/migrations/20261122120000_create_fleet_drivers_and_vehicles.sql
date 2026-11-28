-- ==============================================================================
-- MIGRACIÓN: HUB MI FLOTA — CONDUCTORES Y VEHÍCULOS (PERFIL TRANSPORTISTA)
-- Crea las tablas relacionales multi-tenant public.carrier_vehicles y
-- public.carrier_drivers con control de caducidades (ITV, Seguro, ADR, CAP)
-- y aislamiento RLS estricto por usuario / membresía de empresa.
-- ==============================================================================

-- 1. Tabla de Vehículos de Flota
CREATE TABLE IF NOT EXISTS public.carrier_vehicles (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE,
  carrier_id BIGINT REFERENCES public.carriers(id) ON DELETE SET NULL,

  matricula TEXT NOT NULL,
  tipo TEXT NOT NULL DEFAULT 'Tractora',
  remolque_habitual TEXT,
  marca_modelo TEXT,
  mma_kg NUMERIC(10, 2),
  tara_kg NUMERIC(10, 2),

  -- Vencimientos y documentación normativa
  fecha_caducidad_itv DATE,
  fecha_caducidad_seguro DATE,
  tiene_adr BOOLEAN NOT NULL DEFAULT false,
  fecha_caducidad_adr DATE,
  tarjeta_transporte TEXT,
  autorizacion_especial TEXT,

  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 2. Tabla de Conductores de Flota
CREATE TABLE IF NOT EXISTS public.carrier_drivers (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE,
  carrier_id BIGINT REFERENCES public.carriers(id) ON DELETE SET NULL,
  vehicle_id BIGINT REFERENCES public.carrier_vehicles(id) ON DELETE SET NULL,

  nombre TEXT NOT NULL,
  dni TEXT,
  telefono TEXT,
  email TEXT,

  -- Vehículo habitual asignado
  vehiculo_asignado TEXT,
  remolque_asignado TEXT,

  -- Permisos y cualificaciones normativas
  carnet_tipo TEXT,
  tiene_adr BOOLEAN NOT NULL DEFAULT false,
  fecha_caducidad_adr DATE,
  fecha_caducidad_cap DATE,

  notas TEXT,
  activo BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. Índices de rendimiento y búsqueda rápida
CREATE INDEX IF NOT EXISTS idx_carrier_vehicles_user_id ON public.carrier_vehicles(user_id);
CREATE INDEX IF NOT EXISTS idx_carrier_vehicles_company_id ON public.carrier_vehicles(company_id);
CREATE INDEX IF NOT EXISTS idx_carrier_vehicles_carrier_id ON public.carrier_vehicles(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_vehicles_matricula ON public.carrier_vehicles(matricula);
CREATE INDEX IF NOT EXISTS idx_carrier_vehicles_activo ON public.carrier_vehicles(activo);

CREATE INDEX IF NOT EXISTS idx_carrier_drivers_user_id ON public.carrier_drivers(user_id);
CREATE INDEX IF NOT EXISTS idx_carrier_drivers_company_id ON public.carrier_drivers(company_id);
CREATE INDEX IF NOT EXISTS idx_carrier_drivers_carrier_id ON public.carrier_drivers(carrier_id);
CREATE INDEX IF NOT EXISTS idx_carrier_drivers_vehicle_id ON public.carrier_drivers(vehicle_id);
CREATE INDEX IF NOT EXISTS idx_carrier_drivers_dni ON public.carrier_drivers(dni);
CREATE INDEX IF NOT EXISTS idx_carrier_drivers_vehiculo_asignado ON public.carrier_drivers(vehiculo_asignado);
CREATE INDEX IF NOT EXISTS idx_carrier_drivers_activo ON public.carrier_drivers(activo);

-- 4. Trigger automático para updated_at
CREATE OR REPLACE FUNCTION public.set_fleet_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_carrier_vehicles_updated_at ON public.carrier_vehicles;
CREATE TRIGGER trg_carrier_vehicles_updated_at
  BEFORE UPDATE ON public.carrier_vehicles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_fleet_updated_at();

DROP TRIGGER IF EXISTS trg_carrier_drivers_updated_at ON public.carrier_drivers;
CREATE TRIGGER trg_carrier_drivers_updated_at
  BEFORE UPDATE ON public.carrier_drivers
  FOR EACH ROW
  EXECUTE FUNCTION public.set_fleet_updated_at();

-- 5. Row Level Security (Multi-Tenancy estricto)
ALTER TABLE public.carrier_vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.carrier_drivers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS carrier_vehicles_tenant_isolation ON public.carrier_vehicles;
CREATE POLICY carrier_vehicles_tenant_isolation ON public.carrier_vehicles
  FOR ALL
  USING (
    auth.uid() = user_id
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.company_memberships cm
        WHERE cm.company_id = carrier_vehicles.company_id
          AND cm.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.company_memberships cm
        WHERE cm.company_id = carrier_vehicles.company_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'consultor_admin', 'consultor_operador')
      )
    )
  );

DROP POLICY IF EXISTS carrier_drivers_tenant_isolation ON public.carrier_drivers;
CREATE POLICY carrier_drivers_tenant_isolation ON public.carrier_drivers
  FOR ALL
  USING (
    auth.uid() = user_id
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.company_memberships cm
        WHERE cm.company_id = carrier_drivers.company_id
          AND cm.user_id = auth.uid()
      )
    )
  )
  WITH CHECK (
    auth.uid() = user_id
    OR (
      company_id IS NOT NULL
      AND EXISTS (
        SELECT 1
        FROM public.company_memberships cm
        WHERE cm.company_id = carrier_drivers.company_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'consultor_admin', 'consultor_operador')
      )
    )
  );

COMMENT ON TABLE public.carrier_vehicles IS 'Flota de vehículos de transportistas con control de ITV, seguro, ADR y tarjeta de transporte.';
COMMENT ON TABLE public.carrier_drivers IS 'Conductores de empresas transportistas con vehículo habitual asignado y control de permisos ADR/CAP.';
