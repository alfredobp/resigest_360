-- Add UPDATE policy for map_points table
-- Run this in Supabase SQL Editor if you already created the table

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "Allow authenticated update" ON map_points;

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON map_points
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);
