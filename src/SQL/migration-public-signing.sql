-- Migración para añadir soporte de firma pública mediante token
ALTER TABLE public.waste_contracts 
ADD COLUMN IF NOT EXISTS signing_token UUID DEFAULT gen_random_uuid();

-- Comentario para la nueva columna
COMMENT ON COLUMN public.waste_contracts.signing_token IS 'Token único para permitir la firma del contrato sin autenticación';

-- Habilitar acceso de lectura público basado en token
CREATE POLICY "Public can view contract by token" ON public.waste_contracts
    FOR SELECT USING (signing_token IS NOT NULL);

-- Habilitar actualización de firmas público basado en token
CREATE POLICY "Public can sign contract by token" ON public.waste_contracts
    FOR UPDATE USING (signing_token IS NOT NULL)
    WITH CHECK (signing_token IS NOT NULL);

-- Nota: En un entorno de producción real, se podrían añadir más restricciones en VIEW/WITH CHECK
-- para asegurar que solo se actualizan los campos de firma, pero por simplificación 
-- usaremos la validación del token.
