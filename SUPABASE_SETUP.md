# Integración de Supabase - Autenticación

## Configuración de Variables de Entorno

1. Crea una cuenta en [Supabase](https://supabase.com) si aún no tienes una
2. Crea un nuevo proyecto
3. En el panel de tu proyecto, ve a Settings > API
4. Copia tu `Project URL` y `anon/public key`
5. Actualiza el archivo `.env.local` con tus credenciales:

```env
NEXT_PUBLIC_SUPABASE_URL=tu_url_del_proyecto
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu_anon_key
```

## Características Implementadas

✅ **Autenticación con Email/Password**
- Formulario de inicio de sesión funcional
- Validación de credenciales
- Manejo de errores

✅ **Autenticación con Google**
- Botón de Sign in with Google configurado
- OAuth flow completo

✅ **Protección de Rutas**
- Middleware que protege todas las rutas
- Redirección automática a `/signin` si no estás autenticado
- Redirección automática al dashboard si ya estás autenticado e intentas acceder a `/signin` o `/signup`

✅ **Logout**
- Botón de cerrar sesión en el dropdown del usuario
- Limpieza de sesión y redirección a `/signin`

## Rutas Públicas

Las siguientes rutas son accesibles sin autenticación:
- `/signin` - Página de inicio de sesión
- `/signup` - Página de registro
- `/error-404` - Página de error

## Rutas Protegidas

Todas las demás rutas requieren autenticación:
- `/` - Dashboard principal
- Todas las rutas bajo `(admin)`
- Todas las rutas de perfil, calendario, etc.

## Uso

1. Inicia sesión con email/password o Google
2. Serás redirigido automáticamente al dashboard (`/`)
3. Todas las rutas están protegidas automáticamente
4. Para cerrar sesión, haz clic en tu avatar y selecciona "Sign out"

## Archivos Modificados/Creados

- `src/lib/supabase/client.ts` - Cliente de Supabase para componentes del cliente
- `src/lib/supabase/server.ts` - Cliente de Supabase para componentes del servidor
- `src/lib/supabase/middleware.ts` - Lógica de actualización de sesión
- `src/middleware.ts` - Middleware de Next.js para proteger rutas
- `src/app/auth/callback/route.ts` - Route handler para OAuth callback
- `src/components/auth/SignInForm.tsx` - Formulario de login actualizado
- `src/components/header/UserDropdown.tsx` - Dropdown con botón de logout
- `.env.local` - Variables de entorno (debes configurar tus credenciales)
