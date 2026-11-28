-- ==============================================================================
-- RESIGEST 360 - PLANES PREMIUM MULTI-ROL Y PERÍODO DE CORTESÍA CONFIGURABLE
-- ==============================================================================

-- 1. Columnas de suscripción/cortesía en companies
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS plan_tier TEXT NOT NULL DEFAULT 'basico'
    CHECK (plan_tier IN ('basico', 'trial', 'premium')),
  ADD COLUMN IF NOT EXISTS premium_features JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS trial_ends_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS premium_expires_at TIMESTAMPTZ;

-- 2. Tabla de configuración global de plataforma (editable desde /platform-admin)
CREATE TABLE IF NOT EXISTS public.platform_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

INSERT INTO public.platform_settings (key, value)
VALUES ('trial_days_by_role', '{"transportista": 15}'::jsonb)
ON CONFLICT (key) DO NOTHING;

ALTER TABLE public.platform_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Authenticated users can read platform settings" ON public.platform_settings;
CREATE POLICY "Authenticated users can read platform settings"
  ON public.platform_settings
  FOR SELECT
  USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Admins can manage platform settings" ON public.platform_settings;
CREATE POLICY "Admins can manage platform settings"
  ON public.platform_settings
  FOR ALL
  USING (auth.role() = 'authenticated')
  WITH CHECK (auth.role() = 'authenticated');
