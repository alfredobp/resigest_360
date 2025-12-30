-- Tabla para mapas publicados
-- Permite crear mapas personalizados con capas seleccionadas y compartirlos públicamente

CREATE TABLE IF NOT EXISTS published_maps (
    id BIGSERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    slug VARCHAR(255) UNIQUE NOT NULL, -- URL amigable: /map/slug
    user_id UUID REFERENCES auth.users(id),
    
    -- Configuración del mapa
    center_lat DOUBLE PRECISION DEFAULT 40.4168,
    center_lng DOUBLE PRECISION DEFAULT -3.7038,
    zoom DOUBLE PRECISION DEFAULT 12,
    base_layer VARCHAR(50) DEFAULT 'osm', -- osm, satellite, ign-base, etc.
    
    -- Capas incluidas (array de collection_ids)
    collection_ids BIGINT[] DEFAULT '{}',
    
    -- Configuración de visibilidad
    is_published BOOLEAN DEFAULT false,
    allow_layer_toggle BOOLEAN DEFAULT true, -- Permitir activar/desactivar capas
    show_legend BOOLEAN DEFAULT true,
    show_search BOOLEAN DEFAULT false,
    
    -- Estilo personalizado
    custom_style JSONB DEFAULT '{}',
    
    -- Metadatos
    view_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices
CREATE INDEX IF NOT EXISTS idx_published_maps_slug ON published_maps(slug);
CREATE INDEX IF NOT EXISTS idx_published_maps_user_id ON published_maps(user_id);
CREATE INDEX IF NOT EXISTS idx_published_maps_published ON published_maps(is_published);

-- Función para generar slug único
CREATE OR REPLACE FUNCTION generate_map_slug(map_name TEXT)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 0;
BEGIN
    -- Convertir nombre a slug: minúsculas, sin acentos, espacios a guiones
    base_slug := lower(regexp_replace(map_name, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := trim(both '-' from base_slug);
    final_slug := base_slug;
    
    -- Asegurar que sea único
    WHILE EXISTS (SELECT 1 FROM published_maps WHERE slug = final_slug) LOOP
        counter := counter + 1;
        final_slug := base_slug || '-' || counter;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Trigger para actualizar updated_at
CREATE OR REPLACE FUNCTION update_published_maps_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_published_maps_updated_at
    BEFORE UPDATE ON published_maps
    FOR EACH ROW
    EXECUTE FUNCTION update_published_maps_updated_at();

-- RLS Policies
ALTER TABLE published_maps ENABLE ROW LEVEL SECURITY;

-- Los usuarios pueden ver sus propios mapas
CREATE POLICY "Users can view their own maps"
ON published_maps FOR SELECT
USING (auth.uid() = user_id);

-- Cualquiera puede ver mapas publicados (sin autenticación)
CREATE POLICY "Anyone can view published maps"
ON published_maps FOR SELECT
USING (is_published = true);

-- Los usuarios pueden crear sus propios mapas
CREATE POLICY "Users can create their own maps"
ON published_maps FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Los usuarios pueden actualizar sus propios mapas
CREATE POLICY "Users can update their own maps"
ON published_maps FOR UPDATE
USING (auth.uid() = user_id);

-- Los usuarios pueden eliminar sus propios mapas
CREATE POLICY "Users can delete their own maps"
ON published_maps FOR DELETE
USING (auth.uid() = user_id);

-- Comentarios
COMMENT ON TABLE published_maps IS 'Mapas personalizados que pueden ser compartidos públicamente';
COMMENT ON COLUMN published_maps.slug IS 'URL amigable para acceder al mapa: /map/slug';
COMMENT ON COLUMN published_maps.collection_ids IS 'Array de IDs de colecciones incluidas en el mapa';
COMMENT ON COLUMN published_maps.is_published IS 'Si está publicado, cualquiera puede verlo sin login';

-- Verificación
SELECT 'Tabla published_maps creada exitosamente' as status;

SELECT column_name, data_type, is_nullable
FROM information_schema.columns 
WHERE table_name = 'published_maps'
ORDER BY ordinal_position;
