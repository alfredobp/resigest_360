import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import {
  DRIVER_SESSION_COOKIE,
  verifyDriverSessionToken,
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

export async function POST(request: NextRequest) {
  try {
    const token = request.cookies.get(DRIVER_SESSION_COOKIE)?.value;
    const session = verifyDriverSessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesión de conductor requerida' }, { status: 401 });
    }

    const body = (await request.json()) as {
      endpoint?: string;
      keys?: { p256dh?: string; auth?: string };
    };

    if (!body?.endpoint || !body?.keys?.p256dh || !body?.keys?.auth) {
      return NextResponse.json({ error: 'Suscripción Push incompleta' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const premium = await checkCompanyPremiumFeature(
      supabase,
      { companyId: session.companyId, userId: session.userId },
      'transporte_pwa_evidencias'
    );
    if (!premium.active) {
      return NextResponse.json(
        { error: 'Plan Premium requerido.', code: 'PREMIUM_REQUIRED' },
        { status: 403 }
      );
    }

    const { error } = await supabase.from('push_subscriptions').upsert(
      {
        company_id: session.companyId,
        user_id: session.userId,
        driver_id: session.driverId,
        endpoint: body.endpoint,
        p256dh: body.keys.p256dh,
        auth: body.keys.auth,
        user_agent: request.headers.get('user-agent') || null,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'endpoint' }
    );

    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const token = request.cookies.get(DRIVER_SESSION_COOKIE)?.value;
    const session = verifyDriverSessionToken(token);
    if (!session) {
      return NextResponse.json({ error: 'Sesión de conductor requerida' }, { status: 401 });
    }

    const body = (await request.json().catch(() => ({}))) as { endpoint?: string };
    const supabase = getServiceSupabase();

    let query = supabase
      .from('push_subscriptions')
      .delete()
      .eq('driver_id', session.driverId);

    if (body?.endpoint) {
      query = query.eq('endpoint', body.endpoint);
    }

    const { error } = await query;
    if (error) {
      throw new Error(error.message);
    }

    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

