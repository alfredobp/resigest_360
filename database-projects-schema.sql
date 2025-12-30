-- ============================================
-- PROJECTS SYSTEM - Database Schema
-- ============================================
-- Este script configura las tablas para el sistema de proyectos con jerarquía:
-- Proyectos > Colecciones > Puntos

-- 1. Crear tabla de proyectos
CREATE TABLE IF NOT EXISTS public.projects (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Modificar tabla map_collections para agregar project_id
ALTER TABLE public.map_collections 
ADD COLUMN IF NOT EXISTS project_id BIGINT REFERENCES public.projects(id) ON DELETE CASCADE;

-- 3. Crear índices
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON public.projects(user_id);
CREATE INDEX IF NOT EXISTS idx_map_collections_project_id ON public.map_collections(project_id);

-- 4. Habilitar RLS para projects
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- 5. Eliminar políticas existentes si las hay
DROP POLICY IF EXISTS "Users can view their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can insert their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can update their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can delete their own projects" ON public.projects;

-- 6. Crear políticas de seguridad para projects
CREATE POLICY "Users can view their own projects"
  ON public.projects FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own projects"
  ON public.projects FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own projects"
  ON public.projects FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own projects"
  ON public.projects FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- VERIFICACIÓN
-- ============================================

-- Ver estructura de la tabla projects
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Ver políticas RLS
SELECT schemaname, tablename, policyname
FROM pg_policies
WHERE tablename = 'projects';

-- Verificar índices
SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'projects';
