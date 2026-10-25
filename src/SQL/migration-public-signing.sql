-- Migración para añadir soporte de firma pública mediante token
ALTER TABLE public.waste_contracts 
ADD COLUMN IF NOT EXISTS signing_token UUID DEFAULT gen_random_uuid();

-- Comentario para la nueva columna
COMMENT ON COLUMN public.waste_contracts.signing_token IS 'Token único para permitir la firma del contrato sin autenticación';

-- ATENCIÓN DE SEGURIDAD (CORREGIDO):
-- Las políticas públicas directas basadas en "signing_token IS NOT NULL" han sido eliminadas
-- porque exponían todos los contratos de todos los tenants a cualquier usuario.
-- Para la firma pública sin login, se utiliza la función RPC segura:
-- public.get_contract_by_signing_token(p_token UUID) definida en migration-fix-contracts-rls.sql.
DROP POLICY IF EXISTS "Public can view contract by token" ON public.waste_contracts;
DROP POLICY IF EXISTS "Public can sign contract by token" ON public.waste_contracts;
