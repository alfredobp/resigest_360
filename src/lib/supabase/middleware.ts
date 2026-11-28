import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { canAccessPath, getRequiredModuleForPath } from '@/lib/profiles/moduleCatalog'
import { ACTIVE_COMPANY_COOKIE, resolveTenantContext } from '@/services/tenantContextService'

// Rutas API accesibles sin sesión (formulario comercial, descarga de inspección DeCA, firma pública DI, portal PWA conductor y acceso demo si está habilitado)
export const PUBLIC_API_PREFIXES = ['/api/contact', '/api/deca/', '/api/demo/', '/api/public/', '/api/mobile/conductor/', '/api/push/subscribe']

export function isDemoAccessEnabled(): boolean {
  return process.env.ENABLE_DEMO_ACCESS === 'true' || process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === 'true'
}

function redirectWithSupabaseCookies(
  url: URL,
  supabaseResponse: NextResponse
): NextResponse {
  const redirectResponse = NextResponse.redirect(url)
  supabaseResponse.cookies.getAll().forEach((cookie) => {
    const { name, value, ...options } = cookie
    redirectResponse.cookies.set(name, value, {
      ...options,
      path: options.path || '/',
    })
  })
  return redirectResponse
}

export async function updateSession(request: NextRequest) {
  // Check if environment variables are set
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    console.error('Missing Supabase environment variables')
    return NextResponse.next({
      request,
    })
  }

  let supabaseResponse = NextResponse.next({
    request,
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          supabaseResponse = NextResponse.next({
            request,
          })
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          )
        },
      },
    }
  )

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  let user = null
  try {
    const { data, error } = await supabase.auth.getUser()
    if (!error) {
      user = data.user
    }
  } catch (error) {
    console.error('Error getting user:', error)
  }

  const pathname = request.nextUrl.pathname
  const demoEnabled = isDemoAccessEnabled()

  // Bloquear rutas demo si el flag no está activo
  if (!demoEnabled && (pathname.startsWith('/accesos-prueba') || pathname.startsWith('/api/demo/'))) {
    if (pathname.startsWith('/api/')) {
      return NextResponse.json({ error: 'Acceso demo deshabilitado.' }, { status: 403 })
    }
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    return NextResponse.redirect(url)
  }

  // API protegida por defecto: sin sesión responde 401 JSON (no redirección)
  if (
    !user &&
    pathname.startsWith('/api/') &&
    !PUBLIC_API_PREFIXES.some((prefix) => pathname.startsWith(prefix))
  ) {
    return NextResponse.json(
      { error: 'No autorizado. Se requiere inicio de sesión.' },
      { status: 401 }
    )
  }

  // Protected routes - redirect to signin if not authenticated
  if (
    !user &&
    pathname !== '/' &&
    !pathname.startsWith('/signin') &&
    !pathname.startsWith('/signup') &&
    !pathname.startsWith('/accesos-prueba') &&
    !pathname.startsWith('/error-404') &&
    !pathname.startsWith('/auth/') &&
    !pathname.startsWith('/api/') && // Gestionado arriba (401 para API)
    !pathname.startsWith('/public/') && // Public signature and other public pages
    !pathname.startsWith('/mockups/') && // Design mockups showcase
    !pathname.startsWith('/mobile/deca/') && // Public driver view for DeCA inspection
    !pathname.startsWith('/mobile/conductor') && // Accessory Driver PWA portal (uses driver cookie)
    pathname !== '/manifest.webmanifest' &&
    pathname !== '/sw.js'
  ) {
    // Store the original URL to redirect back after login
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirectedFrom', pathname)
    return NextResponse.redirect(url)
  }

  // Resolver contexto real del tenant cuando la BD está disponible en el cliente SSR
  const canQueryDatabase = typeof (supabase as any).from === 'function'
  let tenantCtx = null
  if (user && canQueryDatabase) {
    const rawCookieId = request.cookies.get(ACTIVE_COMPANY_COOKIE)?.value
    const preferredCompanyId = rawCookieId && Number(rawCookieId) > 0 ? Number(rawCookieId) : null
    try {
      tenantCtx = await resolveTenantContext(supabase, preferredCompanyId)
    } catch {
      tenantCtx = null
    }
  }

  // If user is authenticated and trying to access root landing (/), signin, or signup, redirect to their home
  if (
    user &&
    (pathname === '/' ||
      pathname.startsWith('/signin') ||
      pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone()
    if (tenantCtx) {
      url.pathname =
        !tenantCtx.hasCompletedOnboarding && !tenantCtx.isPlatformAdmin
          ? '/onboarding'
          : tenantCtx.homePath
    } else {
      url.pathname = '/app'
    }
    return redirectWithSupabaseCookies(url, supabaseResponse)
  }

  // Control real de onboarding y permisos por ruta/módulo para usuarios autenticados
  if (
    user &&
    tenantCtx &&
    !pathname.startsWith('/api/') &&
    !pathname.startsWith('/auth/') &&
    !pathname.startsWith('/public/') &&
    !pathname.startsWith('/mobile/deca/') &&
    !pathname.startsWith('/mobile/conductor') &&
    !pathname.startsWith('/accesos-prueba') &&
    !pathname.startsWith('/error-404')
  ) {
    // 1. Redirigir a /onboarding si el usuario aún no ha configurado ninguna empresa
    if (!tenantCtx.hasCompletedOnboarding && !tenantCtx.isPlatformAdmin) {
      if (pathname !== '/onboarding' && !pathname.startsWith('/onboarding/')) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding'
        return redirectWithSupabaseCookies(url, supabaseResponse)
      }
      return supabaseResponse
    }

      // 2. Si ya completó onboarding (o es admin de plataforma) y entra a /onboarding, enviar a su homePath
      if (
        (tenantCtx.hasCompletedOnboarding || tenantCtx.isPlatformAdmin) &&
        (pathname === '/onboarding' || pathname.startsWith('/onboarding/'))
      ) {
        const url = request.nextUrl.clone()
        url.pathname = tenantCtx.homePath
        return redirectWithSupabaseCookies(url, supabaseResponse)
      }

      // 2.b El administrador sin empresa delegada seleccionada solo accede al panel de control de plataforma y perfil/soporte
      const isAdminOnlyAllowedPath =
        pathname === '/platform-admin' ||
        pathname.startsWith('/platform-admin/') ||
        pathname === '/profile' ||
        pathname.startsWith('/profile/') ||
        pathname === '/support' ||
        pathname.startsWith('/support/') ||
        pathname === '/soporte' ||
        pathname.startsWith('/soporte/')

      if (tenantCtx.isPlatformAdmin && !tenantCtx.activeCompany && !isAdminOnlyAllowedPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/platform-admin'
        return redirectWithSupabaseCookies(url, supabaseResponse)
      }

      // 3. Bloquear acceso por URL directa a módulos o rutas de creación no habilitadas para su perfil/rol
      const isPlatformAdminRoute = pathname === '/platform-admin' || pathname.startsWith('/platform-admin/')
      const hasUnrestrictedAdminBypass = tenantCtx.isPlatformAdmin && !tenantCtx.isDelegated
      if (
        !(tenantCtx.isPlatformAdmin && isPlatformAdminRoute) &&
        !canAccessPath(pathname, tenantCtx.activeModules, hasUnrestrictedAdminBypass, {
          membershipRole: tenantCtx.membershipRole,
          perfilOperativo: tenantCtx.perfilOperativo,
        })
      ) {
        const requiredModule = getRequiredModuleForPath(pathname)
        const url = request.nextUrl.clone()
        url.pathname = tenantCtx.homePath
        url.searchParams.set('denied', requiredModule || 'restricted')
        return redirectWithSupabaseCookies(url, supabaseResponse)
      }
    }

    return supabaseResponse
  }
