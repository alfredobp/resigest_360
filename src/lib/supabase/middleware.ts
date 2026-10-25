import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

// Rutas API accesibles sin sesión (formulario comercial y descarga de inspección DeCA por token)
export const PUBLIC_API_PREFIXES = ['/api/contact', '/api/deca/']

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
    request.nextUrl.pathname !== '/' &&
    !request.nextUrl.pathname.startsWith('/signin') &&
    !request.nextUrl.pathname.startsWith('/signup') &&
    !request.nextUrl.pathname.startsWith('/error-404') &&
    !request.nextUrl.pathname.startsWith('/auth/') &&
    !request.nextUrl.pathname.startsWith('/api/') && // Gestionado arriba (401 para API)
    !request.nextUrl.pathname.startsWith('/map/') && // Public map viewer
    !request.nextUrl.pathname.startsWith('/public/') && // Public signature and other public pages
    !request.nextUrl.pathname.startsWith('/mockups/') // Design mockups showcase
  ) {
    // Store the original URL to redirect back after login
    const url = request.nextUrl.clone()
    url.pathname = '/signin'
    url.searchParams.set('redirectedFrom', request.nextUrl.pathname)
    return NextResponse.redirect(url)
  }

  // If user is authenticated and trying to access root landing (/), signin, or signup, redirect to dashboard (/app)
  if (
    user &&
    (request.nextUrl.pathname === '/' ||
      request.nextUrl.pathname.startsWith('/signin') ||
      request.nextUrl.pathname.startsWith('/signup'))
  ) {
    const url = request.nextUrl.clone()
    url.pathname = '/app'
    return NextResponse.redirect(url)
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely!

  return supabaseResponse
}
