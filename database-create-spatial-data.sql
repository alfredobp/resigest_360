-- Migration: Create or update spatial_data table with polygon support
-- Date: 2025-12-23
-- This script works whether the table exists or not

-- Check what tables exist
DO $$ 
BEGIN
    -- If map_points exists, rename it
    IF EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'map_points') THEN
        ALTER TABLE map_points RENAME TO spatial_data;
        RAISE NOTICE 'Table map_points renamed to spatial_data';
    END IF;
    
    -- If spatial_data doesn't exist yet, create it
    IF NOT EXISTS (SELECT FROM pg_tables WHERE schemaname = 'public' AND tablename = 'spatial_data') THEN
        CREATE TABLE spatial_data (
            id BIGSERIAL PRIMARY KEY,
            collection_id BIGINT NOT NULL REFERENCES map_collections(id) ON DELETE CASCADE,
            name VARCHAR(255) NOT NULL,
            description TEXT,
            category VARCHAR(100),
            geometry_type VARCHAR(20) DEFAULT 'point',
            geometry JSONB,
            latitude DOUBLE PRECISION,
            longitude DOUBLE PRECISION,
            address TEXT,
            photo TEXT,
            image TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            user_id UUID REFERENCES auth.users(id)
        );
        
        RAISE NOTICE 'Table spatial_data created';
    END IF;
END $$;

-- Add columns if they don't exist (for existing spatial_data table)
ALTER TABLE spatial_data
ADD COLUMN IF NOT EXISTS geometry_type VARCHAR(20) DEFAULT 'point',
ADD COLUMN IF NOT EXISTS geometry JSONB,
ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id);

-- Add check constraint for geometry types (drop first if exists)
DO $$ 
BEGIN
    ALTER TABLE spatial_data DROP CONSTRAINT IF EXISTS valid_geometry_type;
    ALTER TABLE spatial_data ADD CONSTRAINT valid_geometry_type 
    CHECK (geometry_type IN ('point', 'polygon', 'line', 'circle'));
END $$;

-- Update existing records to use new structure (only if geometry is null)
UPDATE spatial_data
SET 
  geometry_type = COALESCE(geometry_type, 'point'),
  geometry = CASE 
    WHEN geometry IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL THEN
      jsonb_build_object(
        'type', 'Point',
        'coordinates', jsonb_build_array(longitude, latitude)
      )
    ELSE geometry
  END
WHERE geometry IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Set user_id for existing records if null (use first authenticated user as fallback)
UPDATE spatial_data
SET user_id = (SELECT id FROM auth.users LIMIT 1)
WHERE user_id IS NULL;

-- Add comments
COMMENT ON TABLE spatial_data IS 'Datos espaciales: puntos, polígonos, líneas, etc.';
COMMENT ON COLUMN spatial_data.geometry_type IS 'Tipo de geometría: point, polygon, line, circle';
COMMENT ON COLUMN spatial_data.geometry IS 'Datos de geometría en formato GeoJSON';

-- Create indexes for geometry queries (if they don't exist)
CREATE INDEX IF NOT EXISTS idx_spatial_data_collection_id ON spatial_data(collection_id);
CREATE INDEX IF NOT EXISTS idx_spatial_data_geometry_type ON spatial_data(geometry_type);
CREATE INDEX IF NOT EXISTS idx_spatial_data_geometry ON spatial_data USING GIN (geometry);
CREATE INDEX IF NOT EXISTS idx_spatial_data_user_id ON spatial_data(user_id);

-- Enable RLS
ALTER TABLE spatial_data ENABLE ROW LEVEL SECURITY;

-- Create RLS policies if they don't exist
DO $$ 
BEGIN
    -- Drop existing policies if they exist
    DROP POLICY IF EXISTS "Users can view their own spatial data" ON spatial_data;
    DROP POLICY IF EXISTS "Users can insert their own spatial data" ON spatial_data;
    DROP POLICY IF EXISTS "Users can update their own spatial data" ON spatial_data;
    DROP POLICY IF EXISTS "Users can delete their own spatial data" ON spatial_data;
    
    -- Create new policies
    CREATE POLICY "Users can view their own spatial data"
    ON spatial_data FOR SELECT
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can insert their own spatial data"
    ON spatial_data FOR INSERT
    WITH CHECK (auth.uid() = user_id);

    CREATE POLICY "Users can update their own spatial data"
    ON spatial_data FOR UPDATE
    USING (auth.uid() = user_id);

    CREATE POLICY "Users can delete their own spatial data"
    ON spatial_data FOR DELETE
    USING (auth.uid() = user_id);
END $$;

-- Verification queries
SELECT 'Migration completed successfully!' as status;

SELECT 'Spatial data table structure:' as info;
SELECT 
    column_name, 
    data_type, 
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'spatial_data'
ORDER BY ordinal_position;

SELECT 'Sample data (if any):' as info;
SELECT id, name, geometry_type, collection_id FROM spatial_data LIMIT 5;

SELECT 'Indexes:' as info;
SELECT indexname, indexdef 
FROM pg_indexes 
WHERE tablename = 'spatial_data';

SELECT 'Constraints:' as info;
SELECT conname, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'spatial_data'::regclass;
