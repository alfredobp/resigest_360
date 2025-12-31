-- Storage setup for images bucket
-- Execute this in Supabase SQL Editor

-- Create storage bucket for images
INSERT INTO storage.buckets (id, name, public)
VALUES ('images', 'images', true)
ON CONFLICT (id) DO NOTHING;

-- Set up RLS policies for images bucket

-- Allow authenticated users to upload images
CREATE POLICY "Users can upload images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'images' 
  AND (storage.foldername(name))[1] IN ('projects', 'points', 'uploads')
);

-- Allow authenticated users to update images
CREATE POLICY "Users can update images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'images'
);

-- Allow authenticated users to delete images
CREATE POLICY "Users can delete images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'images'
);

-- Allow public read access to all images
CREATE POLICY "Public read access to images"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'images');

-- Verification
SELECT * FROM storage.buckets WHERE id = 'images';
