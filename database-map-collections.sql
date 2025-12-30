-- ============================================
-- MAP COLLECTIONS SYSTEM - Database Schema
-- ============================================
-- Este script configura las tablas y políticas para el sistema de colecciones de mapas
-- Ejecuta esto en el SQL Editor de Supabase

-- 1. Crear tabla de colecciones de mapas
CREATE TABLE IF NOT EXISTS public.map_collections (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modificar tabla map_points para agregar collection_id
-- Si la tabla ya existe, agregamos la columna
ALTER TABLE public.map_points 
ADD COLUMN IF NOT EXISTS collection_id BIGINT REFERENCES public.map_collections(id) ON DELETE CASCADE;

-- Si la tabla NO existe, créala con collection_id incluido
CREATE TABLE IF NOT EXISTS public.map_points (
  id BIGSERIAL PRIMARY KEY,
  collection_id BIGINT REFERENCES public.map_collections(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 3. Crear índices para mejorar el rendimiento
CREATE INDEX IF NOT EXISTS idx_map_collections_user_id ON public.map_collections(user_id);
CREATE INDEX IF NOT EXISTS idx_map_points_collection_id ON public.map_points(collection_id);

-- 4. Habilitar RLS (Row Level Security)
ALTER TABLE public.map_collections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.map_points ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view their own collections" ON public.map_collections;
DROP POLICY IF EXISTS "Users can insert their own collections" ON public.map_collections;
DROP POLICY IF EXISTS "Users can update their own collections" ON public.map_collections;
DROP POLICY IF EXISTS "Users can delete their own collections" ON public.map_collections;

DROP POLICY IF EXISTS "Users can view points in their collections" ON public.map_points;
DROP POLICY IF EXISTS "Users can insert points in their collections" ON public.map_points;
DROP POLICY IF EXISTS "Users can update points in their collections" ON public.map_points;
DROP POLICY IF EXISTS "Users can delete points in their collections" ON public.map_points;

-- 6. Crear políticas de seguridad para map_collections
CREATE POLICY "Users can view their own collections"
  ON public.map_collections FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own collections"
  ON public.map_collections FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own collections"
  ON public.map_collections FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own collections"
  ON public.map_collections FOR DELETE
  USING (auth.uid() = user_id);

-- 7. Crear políticas de seguridad para map_points
CREATE POLICY "Users can view points in their collections"
  ON public.map_points FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.map_collections
      WHERE map_collections.id = map_points.collection_id
      AND map_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can insert points in their collections"
  ON public.map_points FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.map_collections
      WHERE map_collections.id = map_points.collection_id
      AND map_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can update points in their collections"
  ON public.map_points FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.map_collections
      WHERE map_collections.id = map_points.collection_id
      AND map_collections.user_id = auth.uid()
    )
  );

CREATE POLICY "Users can delete points in their collections"
  ON public.map_points FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.map_collections
      WHERE map_collections.id = map_points.collection_id
      AND map_collections.user_id = auth.uid()
    )
  );

-- ============================================
-- VERIFICACIÓN
-- ============================================
-- Ejecuta estas queries para verificar que todo se creó correctamente

-- Ver estructura de tablas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'map_collections'
ORDER BY ordinal_position;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'map_points'
ORDER BY ordinal_position;

-- Ver políticas RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename IN ('map_collections', 'map_points');

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename IN ('map_collections', 'map_points');
