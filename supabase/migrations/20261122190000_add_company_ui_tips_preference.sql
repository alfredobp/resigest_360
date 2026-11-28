-- Preferencia de empresa para mostrar tips, coletillas normativas e instrucciones en la interfaz
-- Por defecto FALSE = Modo simplificado (oculta coletillas, badges normativos de cabecera e instrucciones)
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS mostrar_ayudas_ui BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN public.companies.mostrar_ayudas_ui IS
  'Controla si se muestran tips, coletillas normativas e instrucciones de ayuda en la interfaz (false = modo simplificado por defecto).';
