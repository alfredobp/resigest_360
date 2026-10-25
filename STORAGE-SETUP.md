# Configuración de Almacenamiento de Imágenes en Supabase

## Pasos para configurar el bucket de imágenes

### 1. Ejecutar el script SQL

En el **SQL Editor** de Supabase, ejecuta el archivo:
```
supabase-storage-setup.sql
```

Este script:
- ✅ Crea el bucket público `images`
- ✅ Configura políticas RLS para:
  - Usuarios autenticados pueden subir imágenes en su carpeta
  - Usuarios pueden actualizar/eliminar sus propias imágenes
  - Lectura pública para todos

### 2. Estructura de carpetas

Las imágenes se organizan automáticamente:
```
images/
├── projects/          # Fotos de proyectos
│   └── {user_id}-{timestamp}.jpg
│   └── {user_id}-{timestamp}.jpg
└── uploads/           # Otras imágenes
    └── {user_id}-{timestamp}.jpg
```

### 3. Componente ImageUpload

El componente `ImageUpload` maneja automáticamente:
- ✅ Validación de tipo de archivo (solo imágenes)
- ✅ Validación de tamaño (máximo 5MB)
- ✅ Subida al bucket de Supabase
- ✅ Generación de URL pública
- ✅ Preview de imagen
- ✅ Eliminación de imagen

### 4. Uso en formularios

```tsx
<ImageUpload
  value={newProject.photo}
  onChange={(url) => setNewProject({...newProject, photo: url})}
  label="Fotografía del Proyecto"
  folder="projects"
/>
```

**Props:**
- `value`: URL de la imagen actual
- `onChange`: Callback que recibe la URL pública de la imagen subida
- `bucket`: Nombre del bucket (default: 'images')
- `folder`: Carpeta dentro del bucket (default: 'uploads')
- `label`: Etiqueta del campo
- `preview`: Mostrar preview de la imagen (default: true)

### 5. Formatos soportados

- ✅ JPG/JPEG
- ✅ PNG
- ✅ GIF
- ✅ WebP
- ⚠️ Tamaño máximo: 5MB

### 6. URLs generadas

Las URLs públicas tienen el formato:
```
https://{project-ref}.supabase.co/storage/v1/object/public/images/{folder}/{user_id}-{timestamp}.{ext}
```

### 7. Seguridad

- Solo usuarios autenticados pueden subir imágenes
- Las imágenes se almacenan con el ID del usuario en el nombre
- Las políticas RLS aseguran que solo el propietario puede modificar/eliminar
- Lectura pública para mostrar logos e imágenes

### 8. Integración actual

El componente ya está integrado en:
- ✅ Formulario de nuevo proyecto (campo `photo`)
- ✅ Formulario de edición de proyecto
- ✅ Formulario de nuevo punto (campo `image`)
- 🔄 Pendiente: Formularios de colecciones (si se necesita)

### 9. Verificación

Para verificar que el bucket fue creado correctamente:

```sql
SELECT * FROM storage.buckets WHERE id = 'images';
```

Debe retornar:
```
id: images
name: images
public: true
```
