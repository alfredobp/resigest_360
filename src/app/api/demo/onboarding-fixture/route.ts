import { NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { ACTIVE_COMPANY_COOKIE } from '@/services/tenantContextService';
import { isDemoSignInAllowed } from '@/app/api/demo/signin/route';

/**
 * Genera un correo único y desechable para probar el onboarding desde cero
 * sin alterar ni resetear cuentas con evidencias previas (UXDEV-16 / UX-25).
 */
export function buildFixtureEmail(now = Date.now(), randomSuffix?: string): string {
  const suffix = (randomSuffix || Math.random().toString(36).slice(2, 8))
    .toLowerCase()
    .replace(/[^a-z0-9]/g, '')
    .slice(0, 8) || 'ux16';
  return `onboarding-fixture-${now}-${suffix}@resigest.test`;
}

export async function POST(request: NextRequest) {
  if (!isDemoSignInAllowed()) {
    return NextResponse.json(
      { error: 'El acceso de pruebas y fixtures de onboarding está deshabilitado en este entorno.' },
      { status: 403 }
    );
  }

  let requestedProfile = 'productor';
  try {
    const body = await request.json();
    if (body && typeof body.targetProfile === 'string' && body.targetProfile.trim()) {
      requestedProfile = body.targetProfile.trim();
    }
  } catch {
    // Cuerpo vacío es válido: usa el perfil piloto por defecto (productor)
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    return NextResponse.json(
      {
        error:
          'Falta configurar SUPABASE_SERVICE_ROLE_KEY en el servidor para aprovisionar cuentas vacías desechables de onboarding.',
      },
      { status: 503 }
    );
  }

  const fixtureEmail = buildFixtureEmail();
  const fixturePassword = `ResigestFixture!${Date.now().toString().slice(-6)}`;

  try {
    const adminClient = createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    const { data: createdUser, error: createError } = await adminClient.auth.admin.createUser({
      email: fixtureEmail,
      password: fixturePassword,
      email_confirm: true,
      user_metadata: {
        is_onboarding_fixture: true,
        target_profile: requestedProfile,
        created_for: 'UXDEV-16',
      },
    });

    if (createError || !createdUser?.user) {
      return NextResponse.json(
        {
          error:
            createError?.message ||
            'No se pudo aprovisionar la cuenta vacía desechable en Supabase Auth.',
        },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    try {
      await supabase.auth.signOut();
    } catch {
      // Ignorar si no existía sesión activa previa
    }

    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: fixtureEmail,
      password: fixturePassword,
    });

    if (signInError || !signInData?.user) {
      return NextResponse.json(
        {
          error:
            signInError?.message ||
            'La cuenta desechable fue creada pero no se pudo iniciar sesión automáticamente.',
        },
        { status: 401 }
      );
    }

    const response = NextResponse.json({
      ok: true,
      fixture: true,
      email: fixtureEmail,
      userId: createdUser.user.id,
      targetProfile: requestedProfile,
      label: 'Cuenta Vacía Desechable (Onboarding desde cero)',
      redirectTo: '/onboarding',
    });

    response.cookies.set(ACTIVE_COMPANY_COOKIE, '', {
      path: '/',
      maxAge: 0,
      sameSite: 'lax',
    });

    return response;
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error interno al aprovisionar la fixture de onboarding.' },
      { status: 500 }
    );
  }
}

