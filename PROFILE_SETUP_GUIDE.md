# Guía de Configuración - Sistema de Perfiles con Supabase

## 📋 Pasos para Configurar

### 1. Ejecutar el Script SQL en Supabase

1. Ve a tu proyecto en https://app.supabase.com
2. Navega a **SQL Editor** en el menú lateral
3. Abre el archivo `database-setup.sql` de este proyecto
4. Copia todo el contenido y pégalo en el editor SQL de Supabase
5. Haz clic en **Run** para ejecutar el script

**El script creará:**
- ✅ Tabla `profiles` para datos de usuarios
- ✅ Políticas RLS (Row Level Security)
- ✅ Trigger para crear perfiles automáticamente al registrarse
- ✅ Bucket `avatars` en Storage para fotos de perfil
- ✅ Políticas de Storage para subir/ver fotos
- ✅ Índices para mejor rendimiento

### 2. Verificar la Configuración

Ejecuta estos comandos en el SQL Editor para verificar:

```sql
-- Ver la tabla profiles
SELECT * FROM public.profiles;

-- Ver las políticas de seguridad
SELECT * FROM pg_policies WHERE tablename = 'profiles';

-- Ver el bucket de avatares
SELECT * FROM storage.buckets WHERE id = 'avatars';
```

### 3. Migrar Usuarios Existentes (si aplica)

Si ya tienes usuarios registrados ANTES de crear la tabla, el script ya incluye la migración automática. Verifica que se hayan creado los perfiles:

```sql
SELECT 
  p.id,
  p.email,
  p.first_name,
  p.last_name,
  u.email as auth_email
FROM public.profiles p
LEFT JOIN auth.users u ON p.id = u.id;
```

## 🎯 Funcionalidades Implementadas

### UserMetaCard (Perfil Principal)
- ✅ Carga datos desde tabla `profiles`
- ✅ Upload de foto de perfil con preview
- ✅ Validación de imágenes (tipo y tamaño máx 5MB)
- ✅ Eliminación automática de fotos antiguas
- ✅ Edición de información personal
- ✅ Edición de redes sociales
- ✅ Estados de carga y guardado
- ✅ Manejo de errores

### UserInfoCard (Vista de Información)
- ✅ Carga datos desde tabla `profiles`
- ✅ Muestra información personal
- ✅ Estado de carga mientras obtiene datos

### Sistema de Storage
- ✅ Bucket público para avatares
- ✅ URLs públicas para las imágenes
- ✅ Organización por usuario (carpeta por user_id)
- ✅ Políticas de seguridad (cada usuario solo puede modificar sus fotos)

## 🔄 Flujo de Datos

### Registro de Nuevo Usuario:
1. Usuario se registra en `/signup`
2. Supabase crea el usuario en `auth.users`
3. **Trigger automático** crea el perfil en `profiles`
4. Usuario es redirigido a `/signin`

### Edición de Perfil:
1. Usuario va a `/profile`
2. Componentes cargan datos desde tabla `profiles`
3. Usuario edita datos y/o sube foto
4. Foto se sube a Storage bucket `avatars/[user_id]/[timestamp].[ext]`
5. Datos se actualizan en tabla `profiles`
6. Perfil se recarga automáticamente

### Subida de Fotos:
1. Usuario selecciona imagen (máx 5MB, formatos: JPG, PNG, GIF)
2. Preview se muestra inmediatamente
3. Al guardar, la foto antigua se elimina (si existe)
4. Nueva foto se sube a `avatars/[user_id]/[timestamp].[ext]`
5. URL pública se guarda en `profiles.avatar_url`

## 🛠️ Estructura de Datos

### Tabla `profiles`
```sql
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY,              -- FK a auth.users(id)
  email TEXT,                       -- Email del usuario
  first_name TEXT,                  -- Nombre
  last_name TEXT,                   -- Apellido
  avatar_url TEXT,                  -- URL de la foto de perfil
  bio TEXT,                         -- Biografía
  phone TEXT,                       -- Teléfono
  location TEXT,                    -- Ubicación
  facebook TEXT,                    -- URL de Facebook
  twitter TEXT,                     -- URL de Twitter/X
  linkedin TEXT,                    -- URL de LinkedIn
  instagram TEXT,                   -- URL de Instagram
  created_at TIMESTAMP,             -- Fecha de creación
  updated_at TIMESTAMP              -- Última actualización
);
```

### Storage Bucket `avatars`
- **Carpeta por usuario:** `avatars/[user_id]/`
- **Formato de archivo:** `[timestamp].[extension]`
- **Ejemplo:** `avatars/a1b2c3d4-e5f6-7890-abcd-ef1234567890/1703350000000.jpg`
- **Público:** Sí (cualquiera puede ver las URLs)
- **Permisos:** Solo el propietario puede subir/actualizar/eliminar

## 🔒 Seguridad

### Row Level Security (RLS)
- ✅ Usuarios solo pueden ver su propio perfil
- ✅ Usuarios solo pueden editar su propio perfil
- ✅ Usuarios solo pueden crear su propio perfil

### Storage Policies
- ✅ Cualquiera puede VER las fotos (bucket público)
- ✅ Solo el dueño puede SUBIR fotos a su carpeta
- ✅ Solo el dueño puede ACTUALIZAR sus fotos
- ✅ Solo el dueño puede ELIMINAR sus fotos

## 🧪 Testing

### Probar Registro y Creación Automática:
1. Registra un nuevo usuario en `/signup`
2. Ve al SQL Editor y ejecuta:
```sql
SELECT * FROM public.profiles WHERE email = 'tu-email@ejemplo.com';
```
3. Debería aparecer el perfil creado automáticamente

### Probar Upload de Fotos:
1. Inicia sesión
2. Ve a `/profile`
3. Haz clic en "Edit"
4. Selecciona una foto (el preview debe aparecer)
5. Haz clic en "Save Changes"
6. La foto debe aparecer en el perfil
7. Ve a Supabase > Storage > avatars > [tu-user-id]
8. Debería estar tu foto

### Probar Seguridad:
1. Intenta acceder directamente a la tabla en SQL Editor:
```sql
-- Esto debe funcionar (tu propio perfil)
SELECT * FROM profiles WHERE id = auth.uid();

-- Esto debe fallar o no devolver nada (perfil de otro usuario)
SELECT * FROM profiles WHERE id != auth.uid();
```

## ⚠️ Solución de Problemas

### Error: "relation profiles does not exist"
- ✅ Ejecuta el script `database-setup.sql` completo en Supabase

### Error: "permission denied for table profiles"
- ✅ Verifica que las políticas RLS estén creadas
- ✅ Asegúrate de estar autenticado

### Error: "bucket avatars does not exist"
- ✅ Verifica en Supabase > Storage que el bucket exista
- ✅ Re-ejecuta la sección 8 del script SQL

### Las fotos no se ven
- ✅ Verifica que el bucket `avatars` sea público
- ✅ Verifica que la URL en `profiles.avatar_url` sea correcta
- ✅ Abre la URL directamente en el navegador

### El perfil no se crea automáticamente
- ✅ Verifica que el trigger `on_auth_user_created` exista
- ✅ Verifica que la función `handle_new_user` exista
- ✅ Revisa los logs en Supabase > Database > Logs

## 📚 Recursos

- [Supabase Storage Documentation](https://supabase.com/docs/guides/storage)
- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [Supabase Triggers](https://supabase.com/docs/guides/database/postgres/triggers)

## 🎉 ¡Listo!

Una vez completados estos pasos, tu aplicación tendrá:
- ✅ Sistema completo de perfiles de usuario
- ✅ Upload y gestión de fotos de perfil
- ✅ Almacenamiento seguro en Supabase
- ✅ Actualización automática de perfiles
- ✅ Políticas de seguridad configuradas
