-- ==============================================================================
-- LIMPIEZA DEL MÓDULO DE MAPAS / GIS (DEPRECADO)
-- Elimina tablas, funciones y políticas del visor cartográfico antiguo.
-- NOTA: este script NO se ha ejecutado. REVISAR ANTES de aplicar en Supabase:
--   * Es DESTRUCTIVO e irreversible (se pierden los datos de estas tablas).
--   * Haz una copia de seguridad si hay cualquier duda.
-- Orden: de hijas a padres. CASCADE elimina políticas, índices y triggers asociados.
-- ==============================================================================

DROP TABLE IF EXISTS public.published_maps CASCADE;
DROP TABLE IF EXISTS public.spatial_data CASCADE;
DROP TABLE IF EXISTS public.map_points CASCADE;
DROP TABLE IF EXISTS public.map_collections CASCADE;
DROP TABLE IF EXISTS public.projects CASCADE;

DROP FUNCTION IF EXISTS public.generate_map_slug(TEXT);
DROP FUNCTION IF EXISTS public.update_published_maps_updated_at();
