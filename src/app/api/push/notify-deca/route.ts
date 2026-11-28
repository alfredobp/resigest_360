import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { checkCompanyPremiumFeature } from '@/lib/auth/premiumGate';
import pushNotificationService from '@/services/pushNotificationService';

export async function POST(request: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = (await request.json()) as {
      decaId?: number;
      force?: boolean;
    };

    if (!body?.decaId) {
      return NextResponse.json({ error: 'decaId requerido' }, { status: 400 });
    }

    const { data: deca, error: decaError } = await supabase
      .from('deca_documents')
      .select(
        'id, user_id, company_id, numero_deca, token, conductor_dni, origen_municipio, destino_municipio, matricula_tractora'
      )
      .eq('id', body.decaId)
      .eq('user_id', user.id)
      .maybeSingle();

    if (decaError || !deca) {
      return NextResponse.json({ error: 'DeCA no encontrado' }, { status: 404 });
    }

    const premium = await checkCompanyPremiumFeature(
      supabase,
      { companyId: deca.company_id, userId: user.id },
      'transporte_pwa_evidencias'
    );
    if (!premium.active) {
      return NextResponse.json(
        {
          error: 'Notificaciones Push disponibles únicamente en Plan Premium Transportista.',
          code: 'PREMIUM_REQUIRED',
        },
        { status: 403 }
      );
    }

    // Comprobar configuración de la empresa (si no es envío manual forzado)
    if (!body.force) {
      const compQuery = supabase.from('companies').select('app_config');
      const { data: comp } = deca.company_id
        ? await compQuery.eq('id', deca.company_id).maybeSingle()
        : await compQuery.eq('user_id', user.id).eq('is_my_company', true).maybeSingle();

      const pushEnabled =
        (comp?.app_config as { deca?: { notificar_push_conductor?: boolean } } | null)?.deca
          ?.notificar_push_conductor ?? true;

      if (!pushEnabled) {
        return NextResponse.json({
          ok: true,
          sent: 0,
          skippedReason: 'DISABLED_IN_CONFIG',
        });
      }
    }

    const summary = await pushNotificationService.sendDecaAssignedNotification({
      userId: user.id,
      companyId: deca.company_id,
      conductorDni: deca.conductor_dni,
      numeroDeca: deca.numero_deca,
      token: deca.token,
      origenMunicipio: deca.origen_municipio,
      destinoMunicipio: deca.destino_municipio,
      matricula: deca.matricula_tractora,
    });

    return NextResponse.json({ ok: true, ...summary });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

