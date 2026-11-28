import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { ACTIVE_COMPANY_COOKIE, resolveTenantContext } from '@/services/tenantContextService';

export type DemoProfileKey =
  | 'productor'
  | 'gestor'
  | 'transportista'
  | 'nuevo'
  | 'consultor'
  | 'negociante';

interface DemoAccountConfig {
  email: string;
  defaultRedirect: string;
  label: string;
}

export const DEMO_ACCOUNTS: Record<DemoProfileKey, DemoAccountConfig> = {
  productor: {
    email: process.env.DEMO_PRODUCTOR_EMAIL || 'productor.prueba@resigest.test',
    defaultRedirect: '/app',
    label: 'Productor de Residuos',
  },
  gestor: {
    email: process.env.DEMO_GESTOR_EMAIL || 'gestor.prueba@resigest.test',
    defaultRedirect: '/app',
    label: 'Gestor / Chatarrería',
  },
  transportista: {
    email: process.env.DEMO_TRANSPORTISTA_EMAIL || 'transportista.prueba@resigest.test',
    defaultRedirect: '/app',
    label: 'Transportista',
  },
  nuevo: {
    email: process.env.DEMO_NUEVO_EMAIL || 'nuevo.prueba@resigest.test',
    defaultRedirect: '/onboarding',
    label: 'Cliente Nuevo (Primer Acceso)',
  },
  consultor: {
    email: process.env.DEMO_CONSULTOR_EMAIL || 'consultor.prueba@metodoambiental.test',
    defaultRedirect: '/app',
    label: 'Consultor Método Ambiental',
  },
  negociante: {
    email: process.env.DEMO_NEGOCIANTE_EMAIL || 'negociante.prueba@resigest.test',
    defaultRedirect: '/app',
    label: 'Negociante (Comercial Aislado)',
  },
};

export function isDemoSignInAllowed(): boolean {
  return (
    process.env.ENABLE_DEMO_ACCESS === 'true' ||
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS === 'true'
  );
}

export async function POST(request: NextRequest) {
  if (!isDemoSignInAllowed()) {
    return NextResponse.json(
      { error: 'El acceso rápido de pruebas está deshabilitado en este entorno.' },
      { status: 403 }
    );
  }

  let body: { profileKey?: string } = {};
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Cuerpo JSON inválido.' }, { status: 400 });
  }

  const key = body.profileKey as DemoProfileKey;
  const account = key ? DEMO_ACCOUNTS[key] : undefined;

  if (!account) {
    return NextResponse.json(
      { error: 'Perfil de prueba no reconocido.' },
      { status: 400 }
    );
  }

  const password = process.env.DEMO_ACCOUNTS_PASSWORD || 'ResigestTest2026!';

  try {
    const supabase = await createClient();

    // Limpiar cualquier sesión previa para evitar contaminación entre cuentas
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar si no había sesión previa
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email: account.email,
      password,
    });

    if (error || !data.user) {
      return NextResponse.json(
        {
          error:
            error?.message ||
            `No se pudo iniciar sesión con ${account.email}. Asegúrate de haber ejecutado src/SQL/seed-test-profiles.sql en Supabase.`,
        },
        { status: 401 }
      );
    }

    let redirectTo = account.defaultRedirect;
    try {
      const ctx = await resolveTenantContext(supabase, null);
      redirectTo =
        !ctx.hasCompletedOnboarding && !ctx.isPlatformAdmin
          ? '/onboarding'
          : ctx.homePath;
    } catch {
      redirectTo = account.defaultRedirect;
    }

    const response = NextResponse.json({
      ok: true,
      email: account.email,
      label: account.label,
      redirectTo,
    });

    // Limpiar cookie de empresa activa de la sesión anterior
    response.cookies.set(ACTIVE_COMPANY_COOKIE, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error interno al iniciar sesión de prueba.' },
      { status: 500 }
    );
  }
}
