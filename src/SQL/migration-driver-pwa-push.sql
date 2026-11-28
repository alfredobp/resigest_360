-- ==============================================================================
-- RESIGEST 360 - FASE 2: PWA DE CONDUCTORES Y NOTIFICACIONES PUSH (VAPID)
-- ==============================================================================

-- 1. Acceso PWA en conductores propios (carrier_drivers)
ALTER TABLE public.carrier_drivers
  ADD COLUMN IF NOT EXISTS pin_acceso VARCHAR(20),
  ADD COLUMN IF NOT EXISTS pwa_habilitado BOOLEAN NOT NULL DEFAULT true;

-- 2. Suscripciones Web Push por dispositivo/conductor
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  company_id BIGINT REFERENCES public.companies(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  driver_id BIGINT NOT NULL REFERENCES public.carrier_drivers(id) ON DELETE CASCADE,
  endpoint TEXT NOT NULL UNIQUE,
  p256dh TEXT NOT NULL,
  auth TEXT NOT NULL,
  user_agent TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_driver_id
  ON public.push_subscriptions(driver_id);

CREATE INDEX IF NOT EXISTS idx_push_subscriptions_user_id
  ON public.push_subscriptions(user_id);

ALTER TABLE public.push_subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Companies can manage own driver push subscriptions" ON public.push_subscriptions;
CREATE POLICY "Companies can manage own driver push subscriptions"
  ON public.push_subscriptions
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

