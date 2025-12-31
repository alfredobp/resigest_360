-- Seed Data: Depuradoras de la Comunidad de Madrid
-- Este script inserta datos de prueba para proyectos, colecciones y datos espaciales

-- Variables para IDs (ajustar según tu base de datos)
-- Obtener el user_id actual
DO $$ 
DECLARE
    current_user_id UUID;
    project_id_depuradoras BIGINT;
    collection_id_edar BIGINT;
    collection_id_zonas BIGINT;
BEGIN
    -- Obtener el primer usuario de la base de datos
    SELECT id INTO current_user_id FROM auth.users LIMIT 1;
    
    -- Insertar Proyecto: Infraestructura de Saneamiento Madrid
    INSERT INTO projects (name, description, show, photo, user_id)
    VALUES (
        'Infraestructura de Saneamiento - Comunidad de Madrid',
        'Sistema integral de depuración y tratamiento de aguas residuales en la región metropolitana de Madrid. Incluye EDARs, estaciones de bombeo y zonas de influencia.',
        true,
        '',
        current_user_id
    )
    RETURNING id INTO project_id_depuradoras;
    
    RAISE NOTICE 'Proyecto creado con ID: %', project_id_depuradoras;
    
    -- ============================================
    -- COLECCIÓN 1: EDARs (Estaciones Depuradoras)
    -- ============================================
    INSERT INTO map_collections (project_id, name, description, photo, user_id)
    VALUES (
        project_id_depuradoras,
        'EDARs - Estaciones Depuradoras',
        'Ubicación de las principales estaciones depuradoras de aguas residuales en la Comunidad de Madrid',
        '',
        current_user_id
    )
    RETURNING id INTO collection_id_edar;
    
    RAISE NOTICE 'Colección EDARs creada con ID: %', collection_id_edar;
    
    -- PUNTOS: EDARs en diferentes municipios
    
    -- EDAR Sur (Getafe)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_edar,
        'EDAR Sur - Getafe',
        'Estación depuradora de aguas residuales que da servicio a los municipios del sur de Madrid. Capacidad de tratamiento: 650.000 habitantes equivalentes.',
        'EDAR Principal',
        'point',
        '{"type": "Point", "coordinates": [-3.7329, 40.3058]}'::jsonb,
        40.3058,
        -3.7329,
        'Carretera de Andalucía, km 12, 28906 Getafe, Madrid',
        '',
        '',
        current_user_id
    );
    
    -- EDAR Butarque (Madrid)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_edar,
        'EDAR Butarque',
        'Una de las depuradoras más grandes de España. Trata las aguas residuales del sur de Madrid capital. Capacidad: 2.200.000 habitantes equivalentes.',
        'EDAR Principal',
        'point',
        '{"type": "Point", "coordinates": [-3.7450, 40.3700]}'::jsonb,
        40.3700,
        -3.7450,
        'Calle de los Ángeles, 28914 Leganés, Madrid',
        '',
        '',
        current_user_id
    );
    
    -- EDAR La China (Madrid)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_edar,
        'EDAR La China',
        'Depuradora situada en el distrito de Villaverde. Trata aguas del sureste de Madrid. Capacidad: 300.000 habitantes equivalentes.',
        'EDAR Secundaria',
        'point',
        '{"type": "Point", "coordinates": [-3.6950, 40.3450]}'::jsonb,
        40.3450,
        -3.6950,
        'Calle Embajadores, 28041 Madrid',
        '',
        '',
        current_user_id
    );
    
    -- EDAR Viveros (Alcalá de Henares)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_edar,
        'EDAR Viveros - Alcalá de Henares',
        'Estación depuradora que da servicio al corredor del Henares. Capacidad: 500.000 habitantes equivalentes.',
        'EDAR Principal',
        'point',
        '{"type": "Point", "coordinates": [-3.3706, 40.4818]}'::jsonb,
        40.4818,
        -3.3706,
        'Av. de los Viveros, 28806 Alcalá de Henares, Madrid',
        '',
        '',
        current_user_id
    );
    
    -- EDAR Rejas (San Fernando de Henares)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_edar,
        'EDAR Rejas',
        'Depuradora de gran capacidad situada en el este de Madrid. Trata aguas de varios municipios del corredor del Henares. Capacidad: 1.600.000 habitantes equivalentes.',
        'EDAR Principal',
        'point',
        '{"type": "Point", "coordinates": [-3.5300, 40.4520]}'::jsonb,
        40.4520,
        -3.5300,
        'Calle del Jarama, 28830 San Fernando de Henares, Madrid',
        '',
        '',
        current_user_id
    );
    
    -- EDAR Oeste (Pozuelo de Alarcón)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_edar,
        'EDAR Oeste - Pozuelo',
        'Estación depuradora del oeste de Madrid. Da servicio a Pozuelo, Boadilla y municipios cercanos. Capacidad: 180.000 habitantes equivalentes.',
        'EDAR Secundaria',
        'point',
        '{"type": "Point", "coordinates": [-3.8250, 40.4400]}'::jsonb,
        40.4400,
        -3.8250,
        'Av. de Europa, 28224 Pozuelo de Alarcón, Madrid',
        '',
        '',
        current_user_id
    );
    
    -- EDAR Arroyo Culebro (Leganés)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_edar,
        'EDAR Arroyo Culebro',
        'Depuradora de pequeño tamaño para tratamiento de aguas del polígono industrial de Leganés. Capacidad: 50.000 habitantes equivalentes.',
        'EDAR Industrial',
        'point',
        '{"type": "Point", "coordinates": [-3.7800, 40.3150]}'::jsonb,
        40.3150,
        -3.7800,
        'Polígono Industrial Arroyo Culebro, 28914 Leganés, Madrid',
        '',
        '',
        current_user_id
    );
    
    -- ============================================
    -- COLECCIÓN 2: Zonas de Influencia (Polígonos)
    -- ============================================
    INSERT INTO map_collections (project_id, name, description, photo, user_id)
    VALUES (
        project_id_depuradoras,
        'Zonas de Influencia y Tratamiento',
        'Áreas geográficas cubiertas por cada sistema de depuración. Delimitan las zonas de captación y tratamiento de aguas residuales.',
        '',
        current_user_id
    )
    RETURNING id INTO collection_id_zonas;
    
    RAISE NOTICE 'Colección Zonas creada con ID: %', collection_id_zonas;
    
    -- POLÍGONOS: Zonas de influencia
    
    -- Zona de Influencia EDAR Sur (Getafe, Móstoles, Alcorcón)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_zonas,
        'Zona Sur - EDAR Getafe',
        'Área de captación de la EDAR Sur. Incluye los municipios de Getafe, Móstoles, Alcorcón, Fuenlabrada y Parla. Población servida: 650.000 habitantes.',
        'Zona Principal',
        'polygon',
        '{"type": "Polygon", "coordinates": [[[-3.8651, 40.3226], [-3.6900, 40.3226], [-3.6900, 40.2600], [-3.8651, 40.2600], [-3.8651, 40.3226]]]}'::jsonb,
        40.2913,
        -3.7776,
        'Municipios del Sur de Madrid',
        '',
        '',
        current_user_id
    );
    
    -- Zona de Influencia EDAR Butarque (Centro-Sur Madrid)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_zonas,
        'Zona Centro-Sur - EDAR Butarque',
        'Principal zona de tratamiento de Madrid capital. Cubre desde el centro hasta Villaverde, Carabanchel y Usera. Población servida: 2.200.000 habitantes.',
        'Zona Principal',
        'polygon',
        '{"type": "Polygon", "coordinates": [[[-3.7800, 40.4400], [-3.6500, 40.4400], [-3.6500, 40.3400], [-3.7800, 40.3400], [-3.7800, 40.4400]]]}'::jsonb,
        40.3900,
        -3.7150,
        'Centro y Sur de Madrid Capital',
        '',
        '',
        current_user_id
    );
    
    -- Zona de Influencia EDAR Rejas (Corredor del Henares)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_zonas,
        'Corredor del Henares - EDAR Rejas',
        'Zona este de Madrid. Incluye Torrejón, Coslada, San Fernando, Mejorada y parte de Alcalá. Población servida: 1.600.000 habitantes.',
        'Zona Principal',
        'polygon',
        '{"type": "Polygon", "coordinates": [[[-3.6000, 40.5000], [-3.3500, 40.5000], [-3.3500, 40.4200], [-3.6000, 40.4200], [-3.6000, 40.5000]]]}'::jsonb,
        40.4600,
        -3.4750,
        'Corredor del Henares (Este de Madrid)',
        '',
        '',
        current_user_id
    );
    
    -- Zona de Influencia EDAR Oeste (Pozuelo, Majadahonda)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_zonas,
        'Zona Oeste - Pozuelo',
        'Área residencial del oeste metropolitano. Incluye Pozuelo de Alarcón, Boadilla del Monte, Majadahonda y Las Rozas. Población servida: 180.000 habitantes.',
        'Zona Secundaria',
        'polygon',
        '{"type": "Polygon", "coordinates": [[[-3.9000, 40.4800], [-3.7500, 40.4800], [-3.7500, 40.4000], [-3.9000, 40.4000], [-3.9000, 40.4800]]]}'::jsonb,
        40.4400,
        -3.8250,
        'Municipios del Oeste de Madrid',
        '',
        '',
        current_user_id
    );
    
    -- Zona Industrial Arroyo Culebro
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_zonas,
        'Polígono Industrial Culebro',
        'Zona industrial con tratamiento especializado para aguas residuales industriales. Polígono logístico e industrial de Leganés-Getafe.',
        'Zona Industrial',
        'polygon',
        '{"type": "Polygon", "coordinates": [[[-3.7950, 40.3250], [-3.7650, 40.3250], [-3.7650, 40.3050], [-3.7950, 40.3050], [-3.7950, 40.3250]]]}'::jsonb,
        40.3150,
        -3.7800,
        'Polígono Arroyo Culebro, Leganés',
        '',
        '',
        current_user_id
    );
    
    -- Zona Norte - EDAR Norte (punto adicional)
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_edar,
        'EDAR Norte - Tres Cantos',
        'Depuradora que da servicio al norte de Madrid. Municipios de Tres Cantos, Colmenar Viejo y Alcobendas. Capacidad: 200.000 habitantes equivalentes.',
        'EDAR Secundaria',
        'point',
        '{"type": "Point", "coordinates": [-3.7200, 40.6000]}'::jsonb,
        40.6000,
        -3.7200,
        'Av. de Colmenar Viejo, 28760 Tres Cantos, Madrid',
        '',
        '',
        current_user_id
    );
    
    -- Zona de Influencia Norte
    INSERT INTO spatial_data (
        collection_id, name, description, category,
        geometry_type, geometry, latitude, longitude, address,
        photo, image, user_id
    ) VALUES (
        collection_id_zonas,
        'Zona Norte - Tres Cantos',
        'Zona de captación del norte metropolitano. Incluye Tres Cantos, Colmenar Viejo, Alcobendas y San Sebastián de los Reyes. Población servida: 200.000 habitantes.',
        'Zona Secundaria',
        'polygon',
        '{"type": "Polygon", "coordinates": [[[-3.8000, 40.6500], [-3.6500, 40.6500], [-3.6500, 40.5500], [-3.8000, 40.5500], [-3.8000, 40.6500]]]}'::jsonb,
        40.6000,
        -3.7250,
        'Zona Norte de Madrid',
        '',
        '',
        current_user_id
    );
    
    RAISE NOTICE 'Datos insertados correctamente';
    RAISE NOTICE 'Total: 8 EDARs (puntos) y 6 Zonas de Influencia (polígonos)';
    
END $$;

-- Verificación de datos insertados
SELECT 'Proyectos creados:' as info;
SELECT id, name, description FROM projects WHERE name LIKE '%Saneamiento%' ORDER BY created_at DESC LIMIT 1;

SELECT 'Colecciones creadas:' as info;
SELECT id, project_id, name, description FROM map_collections WHERE name LIKE '%EDAR%' OR name LIKE '%Zona%' ORDER BY created_at DESC;

SELECT 'Datos espaciales - Puntos (EDARs):' as info;
SELECT id, name, geometry_type, latitude, longitude, address
FROM spatial_data 
WHERE geometry_type = 'point' 
ORDER BY created_at DESC 
LIMIT 10;

SELECT 'Datos espaciales - Polígonos (Zonas):' as info;
SELECT id, name, geometry_type, category, 
       jsonb_array_length((geometry->'coordinates')::jsonb->0) as num_vertices
FROM spatial_data 
WHERE geometry_type = 'polygon' 
ORDER BY created_at DESC;
