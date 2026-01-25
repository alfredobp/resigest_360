// =====================================================
-- MIGRACIÓN PARA CREDENCIALES DE SIRA
-- Añade campos para la integración con la Junta de Andalucía
-- =====================================================

ALTER TABLE public.companies
ADD COLUMN IF NOT EXISTS sira_usuario TEXT,
ADD COLUMN IF NOT EXISTS sira_password TEXT,
ADD COLUMN IF NOT EXISTS sira_activo BOOLEAN DEFAULT FALSE;

COMMENT ON COLUMN public.companies.sira_usuario IS 'Nombre de usuario para el Web Service de SIRA';
COMMENT ON COLUMN public.companies.sira_password IS 'Contraseña (en texto plano o cifrada) para el Web Service de SIRA';
