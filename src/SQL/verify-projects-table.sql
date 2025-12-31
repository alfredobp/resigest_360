-- Verificar si existe la tabla projects
SELECT EXISTS (
  SELECT FROM information_schema.tables 
  WHERE table_schema = 'public' 
  AND table_name = 'projects'
);

-- Si existe, ver su estructura
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'projects'
ORDER BY ordinal_position;

-- Ver si hay algún proyecto creado
SELECT * FROM projects LIMIT 5;

-- Ver la estructura de map_collections
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'map_collections'
ORDER BY ordinal_position;
