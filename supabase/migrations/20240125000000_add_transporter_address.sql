-- Add transporter address details to identification_documents
ALTER TABLE identification_documents
ADD COLUMN IF NOT EXISTS transportista_nima TEXT,
ADD COLUMN IF NOT EXISTS transportista_direccion TEXT,
ADD COLUMN IF NOT EXISTS transportista_codigo_postal TEXT,
ADD COLUMN IF NOT EXISTS transportista_municipio TEXT,
ADD COLUMN IF NOT EXISTS transportista_provincia TEXT;

-- Comment on columns
COMMENT ON COLUMN identification_documents.transportista_nima IS 'NIMA del transportista (Requerido por SIRA)';
COMMENT ON COLUMN identification_documents.transportista_direccion IS 'Dirección completa del transportista';
