# Guía de Soporte de Polígonos - Maps Quantia

## 📋 Resumen de Cambios

Se ha actualizado el sistema para soportar múltiples tipos de geometría (puntos y polígonos) en las colecciones de mapas. Los puntos se renombraron a "datos espaciales" para reflejar mejor su propósito.

## ✅ Componentes Actualizados

### 1. **Base de Datos** ⚠️ REQUIERE EJECUCIÓN MANUAL
- **Archivo**: `database-rename-to-spatial-data.sql`
- **Estado**: Creado pero NO ejecutado
- **Acción Requerida**: Debes ejecutar este SQL en tu base de datos Supabase

**Pasos para ejecutar:**
1. Abre el Dashboard de Supabase
2. Ve a SQL Editor
3. Copia y pega el contenido de `database-rename-to-spatial-data.sql`
4. Ejecuta el script
5. Verifica con las consultas de verificación incluidas en el archivo

**Cambios que realiza:**
- Renombra tabla `map_points` → `spatial_data`
- Agrega columna `geometry_type` (point, polygon, line, circle)
- Agrega columna `geometry` (JSONB para almacenar GeoJSON)
- Migra datos existentes al nuevo formato
- Crea índice GIN para búsquedas eficientes

### 2. **PolygonDrawer.tsx** ✅ COMPLETADO
- **Ubicación**: `src/components/common/PolygonDrawer.tsx`
- **Funcionalidad**:
  - Permite agregar/eliminar puntos manualmente
  - Valida mínimo 3 puntos para polígono
  - Auto-cierra el polígono duplicando el primer punto
  - Retorna coordenadas en formato GeoJSON `[[lng, lat], ...]`
  - Soporta coordenadas iniciales para modo edición

**Uso:**
```tsx
<PolygonDrawer
  initialCoordinates={[]} // Opcional: para editar polígono existente
  onSave={(coordinates) => {
    // coordinates = [[lng, lat], [lng, lat], ...]
  }}
  onCancel={() => {}} // Opcional
/>
```

### 3. **projectService.ts** ✅ COMPLETADO
- **Ubicación**: `src/services/projectService.ts`
- **Cambios**:
  - Nueva interfaz `SpatialData` con campos `geometry_type` y `geometry`
  - `MapPoint` ahora es alias de `SpatialData` (compatibilidad)
  - Nuevos métodos: `getSpatialData`, `addSpatialData`, etc.
  - Métodos legacy (`getPoints`, `addPoint`, etc.) redirigen a nuevos métodos
  - `MapCollection.spatial_data_count` reemplaza `points_count`

**Compatibilidad hacia atrás:** ✅
Los métodos antiguos siguen funcionando, convierten automáticamente entre formatos.

### 4. **MapPointsTable.tsx** ✅ COMPLETADO
- **Ubicación**: `src/components/tables/MapPointsTable.tsx`
- **Mejoras**:
  
  **Selector de Tipo de Geometría:**
  - Radio buttons para elegir entre Punto (📍) o Polígono (⬟)
  - Formulario se adapta según selección

  **Formulario de Creación:**
  - **Modo Punto**: Campos de latitud/longitud
  - **Modo Polígono**: Integración de `PolygonDrawer`

  **Tabla de Datos:**
  - Nueva columna "Tipo" con iconos (📍 punto, ⬟ polígono)
  - Columna "Coordenadas" muestra:
    - Para puntos: `Lat: X, Lng: Y`
    - Para polígonos: `N puntos`

  **Modo Edición:**
  - Puntos: Inputs de lat/lng
  - Polígonos: PolygonDrawer con coordenadas precargadas

### 5. **Map.tsx** ✅ COMPLETADO
- **Ubicación**: `src/components/Map/Map.tsx`
- **Nuevas Capacidades**:

  **Renderizado de Puntos:**
  - Marcadores con color por colección (sin cambios)
  - Popups con imagen, descripción, categoría

  **Renderizado de Polígonos:**
  - Capa de relleno semitransparente (`fill-opacity: 0.3`)
  - Contorno con color de colección
  - Popups al hacer clic
  - Cursor pointer al hover
  - Limpieza automática al ocultar colección

  **Gestión de Capas:**
  - Separación automática entre puntos y polígonos
  - Source/Layer único por colección
  - Limpieza de capas al desactivar visibilidad

## 🎨 Flujo de Usuario

### Crear un Punto
1. En MapPointsTable, hacer clic en "Agregar Dato Espacial"
2. Seleccionar "📍 Punto"
3. Rellenar nombre, descripción
4. Ingresar latitud y longitud
5. (Opcional) Agregar categoría, dirección, imagen
6. Guardar

### Crear un Polígono
1. En MapPointsTable, hacer clic en "Agregar Dato Espacial"
2. Seleccionar "⬟ Polígono"
3. Rellenar nombre, descripción
4. **Definir puntos del polígono:**
   - Ingresar latitud y longitud de cada esquina
   - Hacer clic en "+ Punto" para agregar
   - Repetir para al menos 3 puntos
   - Eliminar puntos con la X si es necesario
5. Hacer clic en "Guardar Polígono" (en PolygonDrawer)
6. (Opcional) Agregar categoría, dirección, imagen
7. Guardar

### Visualizar en el Mapa
1. Ir al componente del mapa
2. Expandir el proyecto deseado en el panel de capas
3. Activar la colección que contiene los datos
4. Ver:
   - **Puntos**: Marcadores con color de colección
   - **Polígonos**: Áreas rellenas semitransparentes con contorno
5. Hacer clic en cualquier elemento para ver su información en popup

## 📊 Formato de Datos

### Punto (GeoJSON)
```json
{
  "geometry_type": "point",
  "geometry": {
    "type": "Point",
    "coordinates": [-3.7038, 40.4168]  // [longitude, latitude]
  },
  "latitude": 40.4168,
  "longitude": -3.7038
}
```

### Polígono (GeoJSON)
```json
{
  "geometry_type": "polygon",
  "geometry": {
    "type": "Polygon",
    "coordinates": [
      [
        [-3.7038, 40.4168],  // [lng, lat] punto 1
        [-3.7020, 40.4180],  // punto 2
        [-3.7010, 40.4160],  // punto 3
        [-3.7038, 40.4168]   // punto 1 repetido (cierra polígono)
      ]
    ]
  },
  "latitude": 40.4168,  // Primera coordenada (referencia)
  "longitude": -3.7038
}
```

## 🔄 Orden de Ejecución

**ANTES de usar la aplicación:**

1. ✅ **Ejecutar `database-rename-to-spatial-data.sql` en Supabase**
   - Dashboard → SQL Editor → Pegar script → Ejecutar
   - Verificar con queries de verificación al final del archivo

2. ✅ **Reiniciar el servidor de desarrollo (si estaba corriendo)**
   ```bash
   npm run dev
   ```

3. ✅ **Probar la funcionalidad:**
   - Crear un punto → Verificar en mapa
   - Crear un polígono → Verificar en mapa
   - Editar ambos tipos
   - Cambiar visibilidad de capas

## 🐛 Posibles Problemas

### "Table spatial_data does not exist"
**Causa**: No ejecutaste el SQL de migración
**Solución**: Ejecuta `database-rename-to-spatial-data.sql` en Supabase

### Polígonos no se ven en el mapa
**Causa**: Coordenadas incorrectas o menos de 3 puntos
**Solución**: Verifica que el polígono tiene al menos 3 puntos y coordenadas válidas

### Error "geometry is required"
**Causa**: El formulario de polígono no se guardó correctamente
**Solución**: Haz clic en "Guardar Polígono" en PolygonDrawer antes de "Guardar" en el formulario principal

### Datos antiguos no aparecen
**Causa**: El script de migración convierte automáticamente los puntos antiguos
**Solución**: Si no aparecen, verifica que la migración se ejecutó correctamente con las queries de verificación

## 🚀 Próximas Mejoras Sugeridas

1. **Líneas/Polylines**: Para rutas o trayectos
2. **Círculos**: Para áreas de radio específico
3. **Editor de polígonos en el mapa**: Dibujar directamente con el mouse
4. **Importar desde archivo**: Cargar KML, GeoJSON, Shapefile
5. **Exportar colecciones**: Descargar como GeoJSON
6. **Medición de áreas**: Calcular automáticamente el área de polígonos
7. **Búsqueda espacial**: Filtrar por proximidad o dentro de área

## 📝 Notas Técnicas

- **GeoJSON**: Estándar internacional para datos geoespaciales
- **MapLibre GL**: Renderiza polígonos de forma eficiente en GPU
- **Índice GIN**: Permite búsquedas rápidas en geometría JSONB
- **RLS Policies**: Se transfieren automáticamente al renombrar tabla
- **Backwards Compatibility**: Código antiguo sigue funcionando sin cambios

---

**Última actualización**: Diciembre 2024
**Versión**: 2.0 (Soporte multi-geometría)
