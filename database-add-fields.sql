-- Migration: Add mostrar and fotografia fields to projects, collections, and points
-- Date: 2025-12-23

-- Add fields to projects table
ALTER TABLE projects
ADD COLUMN IF NOT EXISTS show BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS photo TEXT;

-- Add comment
COMMENT ON COLUMN projects.show IS 'Define si el proyecto se muestra en el mapa general';
COMMENT ON COLUMN projects.photo IS 'URL de la fotografía del proyecto';

-- Add fields to map_collections table
ALTER TABLE map_collections
ADD COLUMN IF NOT EXISTS photo TEXT;

COMMENT ON COLUMN map_collections.photo IS 'URL de la fotografía de la colección';

-- Add fields to map_points table
ALTER TABLE map_points
ADD COLUMN IF NOT EXISTS photo TEXT,
ADD COLUMN IF NOT EXISTS image TEXT;

COMMENT ON COLUMN map_points.photo IS 'URL de la fotografía del punto de interés';
COMMENT ON COLUMN map_points.image IS 'URL de la imagen del punto de interés mostrada en popup';

-- Create index for better performance when filtering by show
CREATE INDEX IF NOT EXISTS idx_projects_show ON projects(show);

-- Update existing projects to have show=true by default
UPDATE projects SET show = true WHERE show IS NULL;

-- Verification queries
SELECT 'Projects with new fields:' as info;
SELECT id, name, show, photo FROM projects LIMIT 5;

SELECT 'Collections with new fields:' as info;
SELECT id, name, photo FROM map_collections LIMIT 5;

SELECT 'Points with new fields:' as info;
SELECT id, name, photo, image FROM map_points LIMIT 5;
