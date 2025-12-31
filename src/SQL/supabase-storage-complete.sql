-- =====================================================
-- STORAGE SETUP - Complete Configuration
-- Configuración completa de almacenamiento en Supabase
-- =====================================================
-- Execute this in Supabase SQL Editor

-- =====================================================
-- 1. CREATE IMAGES BUCKET
-- =====================================================

-- Create storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- =====================================================
-- 2. DROP EXISTING POLICIES (to avoid conflicts)
-- =====================================================

DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to images" ON storage.objects;

-- =====================================================
-- 3. CREATE RLS POLICIES FOR IMAGES BUCKET
-- =====================================================

-- Allow authenticated users to upload images (any folder within images bucket)
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- Allow authenticated users to update images
CREATE POLICY "Users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Allow authenticated users to delete images
CREATE POLICY "Users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- Allow public read access to all images (needed for displaying logos, photos, etc.)
CREATE POLICY "Public read access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- =====================================================
-- 4. VERIFICATION
-- =====================================================

-- Check bucket was created
SELECT 
  id,
  name,
  public,
  created_at
FROM storage.buckets 
WHERE id = 'images';

-- Check policies were created
SELECT 
  policyname,
  cmd,
  qual
FROM pg_policies 
WHERE schemaname = 'storage' 
  AND tablename = 'objects'
ORDER BY policyname;

-- =====================================================
-- FOLDER STRUCTURE
-- =====================================================
-- images/
-- ├── projects/          # Fotos de proyectos de mapas
-- ├── points/            # Imágenes de puntos en mapas
-- ├── uploads/           # Otras imágenes generales
-- ├── company-logos/     # Logos de empresas (gestión residuos)
-- └── waste-documents/   # Documentos PDF de contratos, DI, etc.
-- =====================================================
