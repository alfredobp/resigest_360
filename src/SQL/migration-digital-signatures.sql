-- =============================================================================
-- Migración: Firma Electrónica PAdES con AutoFirma (Custodia Inmutable)
-- ResiGest 360 - Multi-Tenancy + RLS estricto
-- =============================================================================

-- 0. Flag de activación opcional por empresa en Mi Empresa -> Integraciones
ALTER TABLE public.companies
  ADD COLUMN IF NOT EXISTS firma_electronica_activa BOOLEAN NOT NULL DEFAULT FALSE;

-- 1. Tabla de custodia inmutable de PDFs firmados digitalmente (PAdES)
CREATE TABLE IF NOT EXISTS public.signed_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id BIGINT NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL CHECK (
    entity_type IN ('contract', 'di', 'deca', 'memoria_anual', 'commercial_operation')
  ),
  entity_id TEXT NOT NULL,
  entity_version INT NOT NULL DEFAULT 1,
  storage_path TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size_bytes BIGINT NOT NULL CHECK (file_size_bytes > 0),
  sha256_hash TEXT NOT NULL,
  original_sha256_hash TEXT,
  signature_level TEXT NOT NULL DEFAULT 'PAdES-BES',
  signature_provider TEXT NOT NULL DEFAULT 'autofirma',
  signature_count INT NOT NULL DEFAULT 1 CHECK (signature_count >= 1),
  signer_cn TEXT NOT NULL,
  signer_nif TEXT,
  issuer_cn TEXT NOT NULL,
  certificate_serial TEXT NOT NULL,
  certificate_valid_to TIMESTAMPTZ,
  signed_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Índices para consultas rápidas por entidad y tenant
CREATE INDEX IF NOT EXISTS idx_signed_documents_entity
  ON public.signed_documents (company_id, entity_type, entity_id, signed_at DESC);

CREATE INDEX IF NOT EXISTS idx_signed_documents_user
  ON public.signed_documents (user_id, signed_at DESC);

CREATE INDEX IF NOT EXISTS idx_signed_documents_sha256
  ON public.signed_documents (sha256_hash);

-- 2. Habilitar Row Level Security (RLS)
ALTER TABLE public.signed_documents ENABLE ROW LEVEL SECURITY;

-- Política SELECT: propietario o miembro de la empresa del tenant
DROP POLICY IF EXISTS "signed_documents_select_tenant" ON public.signed_documents;
CREATE POLICY "signed_documents_select_tenant"
  ON public.signed_documents
  FOR SELECT
  USING (
    auth.uid() = user_id
    OR EXISTS (
      SELECT 1
      FROM public.companies c
      WHERE c.id = signed_documents.company_id
        AND c.user_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1
      FROM public.company_memberships cm
      WHERE cm.company_id = signed_documents.company_id
        AND cm.user_id = auth.uid()
    )
  );

-- Política INSERT: usuario autenticado perteneciente a la empresa
DROP POLICY IF EXISTS "signed_documents_insert_tenant" ON public.signed_documents;
CREATE POLICY "signed_documents_insert_tenant"
  ON public.signed_documents
  FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id = signed_documents.company_id
          AND c.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.company_memberships cm
        WHERE cm.company_id = signed_documents.company_id
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'consultor_admin', 'consultor_operador')
      )
    )
  );

-- Sin políticas UPDATE ni DELETE: la custodia de documentos firmados es inmutable.

-- 3. Bucket privado de Supabase Storage para PDFs firmados
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'signed-documents',
  'signed-documents',
  FALSE,
  20971520, -- 20 MB
  ARRAY['application/pdf']
)
ON CONFLICT (id) DO UPDATE SET
  public = FALSE,
  file_size_limit = 20971520,
  allowed_mime_types = ARRAY['application/pdf'];

-- Políticas Storage: acceso restringido a la carpeta "{company_id}/..."
DROP POLICY IF EXISTS "signed_documents_storage_select" ON storage.objects;
CREATE POLICY "signed_documents_storage_select"
  ON storage.objects
  FOR SELECT
  USING (
    bucket_id = 'signed-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id::text = (storage.foldername(name))[1]
          AND c.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.company_memberships cm
        WHERE cm.company_id::text = (storage.foldername(name))[1]
          AND cm.user_id = auth.uid()
      )
    )
  );

DROP POLICY IF EXISTS "signed_documents_storage_insert" ON storage.objects;
CREATE POLICY "signed_documents_storage_insert"
  ON storage.objects
  FOR INSERT
  WITH CHECK (
    bucket_id = 'signed-documents'
    AND (
      EXISTS (
        SELECT 1
        FROM public.companies c
        WHERE c.id::text = (storage.foldername(name))[1]
          AND c.user_id = auth.uid()
      )
      OR EXISTS (
        SELECT 1
        FROM public.company_memberships cm
        WHERE cm.company_id::text = (storage.foldername(name))[1]
          AND cm.user_id = auth.uid()
          AND cm.role IN ('owner', 'consultor_admin', 'consultor_operador')
      )
    )
  );

