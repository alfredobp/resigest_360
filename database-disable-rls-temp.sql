-- Desactivar RLS temporalmente para ver todos los datos
-- SOLO PARA DESARROLLO

-- Desactivar RLS en spatial_data
ALTER TABLE spatial_data DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en projects
ALTER TABLE projects DISABLE ROW LEVEL SECURITY;

-- Desactivar RLS en map_collections
ALTER TABLE map_collections DISABLE ROW LEVEL SECURITY;

-- Verificación
SELECT 'RLS desactivado - Ahora puedes ver todos los datos' as status;

SELECT 'Total de proyectos:' as info, COUNT(*) as count FROM projects;
SELECT 'Total de colecciones:' as info, COUNT(*) as count FROM map_collections;
SELECT 'Total de datos espaciales:' as info, COUNT(*) as count FROM spatial_data;
