-- Fix Storage RLS Policies
-- Execute this in Supabase SQL Editor to fix the permission error

-- Drop old policies if they exist
DROP POLICY IF EXISTS "Users can upload images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete own images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete images" ON storage.objects;
DROP POLICY IF EXISTS "Public read access to images" ON storage.objects;

-- Create new correct policies

-- Allow authenticated users to upload images to specific folders
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] IN ('projects', 'points', 'uploads')
);

-- Allow authenticated users to update any image
CREATE POLICY "Users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'images');

-- Allow authenticated users to delete any image
CREATE POLICY "Users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- Allow public read access to all images
CREATE POLICY "Public read access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Verification
SELECT 
  schemaname, 
  tablename, 
  policyname, 
  permissive, 
  roles, 
  cmd 
FROM pg_policies 
WHERE tablename = 'objects' 
AND schemaname = 'storage';
