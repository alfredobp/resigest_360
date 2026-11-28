import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DRIVER_SESSION_COOKIE,
  signDriverSessionToken,
} from '@/lib/auth/driverSession';
import { checkCompanyPremiumFeature } from '@/lib/auth/premiumGate';

function getServiceSupabase() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    throw new Error('Configuración de Supabase incompleta');
  }

  return createClient(url, key, { auth: { persistSession: false } });
}

function normalizeDni(value?: string | null): string {
  return (value || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { dni?: string; pin?: string };
    const dni = normalizeDni(body?.dni);
    const pin = (body?.pin || '').trim();

    if (!dni || !pin) {
      return NextResponse.json(
        { error: 'Introduce tu DNI/NIE y tu PIN de acceso.' },
        { status: 400 }
      );
    }

    const supabase = getServiceSupabase();
    const { data: drivers, error } = await supabase
      .from('carrier_drivers')
      .select('id, user_id, company_id, nombre, dni, pin_acceso, pwa_habilitado, activo')
      .eq('activo', true)
      .eq('pwa_habilitado', true);

    if (error) {
      throw new Error(error.message);
    }

    const matched = (drivers || []).find(
      (d) =>
        normalizeDni(d.dni) === dni &&
        Boolean(d.pin_acceso) &&
        String(d.pin_acceso).trim() === pin
    );

    if (!matched) {
      return NextResponse.json(
        { error: 'DNI o PIN incorrecto, o acceso PWA no habilitado por tu empresa.' },
        { status: 401 }
      );
    }

    const premium = await checkCompanyPremiumFeature(
      supabase,
      { companyId: matched.company_id ?? null, userId: matched.user_id },
      'transporte_pwa_evidencias'
    );
    if (!premium.active) {
      return NextResponse.json(
        {
          error: 'El Portal PWA de Conductores requiere un Plan Premium Transportista activo.',
          code: 'PREMIUM_REQUIRED',
        },
        { status: 403 }
      );
    }

    const sessionToken = signDriverSessionToken({
      driverId: matched.id,
      companyId: matched.company_id ?? null,
      userId: matched.user_id,
      dni: normalizeDni(matched.dni),
      nombre: matched.nombre,
    });

    const response = NextResponse.json({
      ok: true,
      driver: {
        id: matched.id,
        nombre: matched.nombre,
        dni: normalizeDni(matched.dni),
      },
    });

    response.cookies.set(DRIVER_SESSION_COOKIE, sessionToken, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE() {
  const response = NextResponse.json({ ok: true });
  response.cookies.set(DRIVER_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  });
  return response;
}

