-- Create map_points table in Supabase
-- Run this SQL in your Supabase SQL Editor

CREATE TABLE IF NOT EXISTS map_points (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  category TEXT,
  latitude DOUBLE PRECISION NOT NULL,
  longitude DOUBLE PRECISION NOT NULL,
  address TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index on coordinates for better performance
CREATE INDEX IF NOT EXISTS idx_map_points_coords ON map_points(latitude, longitude);

-- Enable Row Level Security
ALTER TABLE map_points ENABLE ROW LEVEL SECURITY;

-- Create policy to allow all users to read
CREATE POLICY "Allow public read access" ON map_points
  FOR SELECT
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to insert
CREATE POLICY "Allow authenticated insert" ON map_points
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- Create policy to allow authenticated users to delete
CREATE POLICY "Allow authenticated delete" ON map_points
  FOR DELETE
  TO authenticated
  USING (true);

-- Create policy to allow authenticated users to update
CREATE POLICY "Allow authenticated update" ON map_points
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert sample data for Madrid
INSERT INTO map_points (name, description, category, latitude, longitude, address) VALUES
  ('Puerta del Sol', 'Plaza emblemática del centro de Madrid, considerada el kilómetro cero de España.', 'Monumento', 40.4168, -3.7038, 'Puerta del Sol, s/n, 28013 Madrid'),
  ('Palacio Real', 'Residencia oficial de la familia real española, uno de los palacios más grandes de Europa.', 'Monumento', 40.4179, -3.7143, 'Calle de Bailén, s/n, 28071 Madrid'),
  ('Museo del Prado', 'Uno de los museos de arte más importantes del mundo, con obras maestras de Velázquez y Goya.', 'Museo', 40.4138, -3.6921, 'Paseo del Prado, s/n, 28014 Madrid'),
  ('Parque del Retiro', 'Extenso parque público con jardines, monumentos y el famoso estanque para paseos en barca.', 'Parque', 40.4153, -3.6844, 'Plaza de la Independencia, 7, 28001 Madrid'),
  ('Plaza Mayor', 'Plaza porticada del siglo XVII, centro neurálgico de la vida madrileña.', 'Plaza', 40.4155, -3.7074, 'Plaza Mayor, 28012 Madrid'),
  ('Templo de Debod', 'Antiguo templo egipcio donado a España, situado en el Parque del Cuartel de la Montaña.', 'Monumento', 40.4240, -3.7178, 'Calle Ferraz, 1, 28008 Madrid'),
  ('Museo Reina Sofía', 'Museo de arte moderno y contemporáneo, hogar del famoso Guernica de Picasso.', 'Museo', 40.4079, -3.6942, 'Calle de Santa Isabel, 52, 28012 Madrid'),
  ('Gran Vía', 'Principal vía comercial de Madrid, conocida por sus teatros y edificios históricos.', 'Calle', 40.4200, -3.7050, 'Gran Vía, Madrid'),
  ('Mercado de San Miguel', 'Mercado gourmet en estructura de hierro del siglo XX, con productos gastronómicos selectos.', 'Mercado', 40.4154, -3.7089, 'Plaza de San Miguel, s/n, 28005 Madrid'),
  ('Santiago Bernabéu', 'Estadio del Real Madrid, uno de los más emblemáticos del fútbol mundial.', 'Estadio', 40.4530, -3.6884, 'Av. de Concha Espina, 1, 28036 Madrid');
