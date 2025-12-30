-- Migration: Rename map_points to spatial_data and add polygon support
-- Date: 2025-12-23

-- Rename table
ALTER TABLE map_points RENAME TO spatial_data;

-- Add geometry type field
ALTER TABLE spatial_data
ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(20) DEFAULT 'point',
ADD COLUMN IF NOT EXISTS geometry JSONB;

-- Add check constraint for geometry types
ALTER TABLE spatial_data
ADD CONSTRAINT valid_geometry_type 
CHECK (geometry_type IN ('point', 'polygon', 'line', 'circle'));

-- Update existing records to use new structure
UPDATE spatial_data
SET 
  geometry_type = 'point',
  geometry = jsonb_build_object(
    'type', 'Point',
    'coordinates', jsonb_build_array(longitude, latitude)
  )
WHERE geometry IS NULL;

-- Add comments
COMMENT ON TABLE spatial_data IS 'Datos espaciales: puntos, polígonos, líneas, etc.';
COMMENT ON COLUMN spatial_data.geometry_type IS 'Tipo de geometría: point, polygon, line, circle';
COMMENT ON COLUMN spatial_data.geometry IS 'Datos de geometría en formato GeoJSON';

-- Create index for geometry queries
CREATE INDEX IF NOT EXISTS idx_spatial_data_geometry_type ON spatial_data(geometry_type);
CREATE INDEX IF NOT EXISTS idx_spatial_data_geometry ON spatial_data USING GIN (geometry);

-- RLS Policies will automatically work with renamed table
-- No need to rename them explicitly

-- Verification queries
SELECT 'Spatial data table:' as info;
SELECT id, name, geometry_type, collection_id FROM spatial_data LIMIT 5;

SELECT 'Check constraints:' as info;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'spatial_data'::regclass;
