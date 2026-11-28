import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import type { DecaMobileConfig } from '@/types/wasteManagement';

type DriverActionType = 'sign' | 'report_ticket' | 'finalize';

interface DriverActionBody {
  action: DriverActionType;
  driverDniOrPin?: string;
  driverName?: string;
  signatureDataUrl?: string;
  ticketDataUrl?: string;
  incidentNote?: string;
}

const DEFAULT_DECA_MOBILE_CONFIG: DecaMobileConfig = {
  permitir_firma_movil: true,
  permitir_subida_ticket: true,
  permitir_finalizar_movil: true,
  requerir_dni_conductor: true,
};

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

function normalizeVerification(value?: string | null): string {
  return (value || '').trim().toUpperCase().replace(/[\s-]/g, '');
}

async function resolveCompanyDecaConfig(
  supabase: ReturnType<typeof getServiceSupabase>,
  deca: { company_id?: number | null; user_id: string }
): Promise<DecaMobileConfig> {
  try {
    const query = supabase.from('companies').select('app_config');
    const { data } = deca.company_id
      ? await query.eq('id', deca.company_id).maybeSingle()
      : await query.eq('user_id', deca.user_id).eq('is_my_company', true).maybeSingle();

    const raw = (data?.app_config as { deca?: Partial<DecaMobileConfig> } | null)?.deca;
    if (!raw) return DEFAULT_DECA_MOBILE_CONFIG;

    return {
      permitir_firma_movil: raw.permitir_firma_movil ?? true,
      permitir_subida_ticket: raw.permitir_subida_ticket ?? true,
      permitir_finalizar_movil: raw.permitir_finalizar_movil ?? true,
      requerir_dni_conductor: raw.requerir_dni_conductor ?? true,
    };
  } catch {
    return DEFAULT_DECA_MOBILE_CONFIG;
  }
}

async function uploadTicketToStorage(
  supabase: ReturnType<typeof getServiceSupabase>,
  decaId: number,
  dataUrl: string
): Promise<string> {
  const match = dataUrl.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,(.+)$/);
  if (!match || !supabase.storage) {
    return dataUrl;
  }

  try {
    const mimeType = match[1];
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png';
    const buffer = Buffer.from(match[2], 'base64');
    const path = `deca/${decaId}/ticket-${Date.now()}.${ext}`;

    const { error: uploadError } = await supabase.storage
      .from('deca-evidences')
      .upload(path, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) {
      return dataUrl;
    }

    const { data: urlData } = supabase.storage
      .from('deca-evidences')
      .getPublicUrl(path);

    return urlData?.publicUrl || dataUrl;
  } catch {
    return dataUrl;
  }
}

export async function GET(
  _request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
    }

    const supabase = getServiceSupabase();
    const { data: deca, error } = await supabase
      .from('deca_documents')
      .select('id, user_id, company_id')
      .eq('token', token)
      .maybeSingle();

    if (error || !deca) {
      return NextResponse.json({ error: 'Documento DeCA no encontrado' }, { status: 404 });
    }

    const config = await resolveCompanyDecaConfig(supabase, deca);
    return NextResponse.json({ config });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;
    if (!token) {
      return NextResponse.json({ error: 'Token no proporcionado' }, { status: 400 });
    }

    const body = (await request.json()) as DriverActionBody;
    if (!body?.action) {
      return NextResponse.json({ error: 'Acción no especificada' }, { status: 400 });
    }

    const supabase = getServiceSupabase();

    // 1. Buscar DeCA por token criptográfico
    const { data: deca, error: decaError } = await supabase
      .from('deca_documents')
      .select('*')
      .eq('token', token)
      .maybeSingle();

    if (decaError || !deca) {
      return NextResponse.json(
        { error: 'Documento DeCA no encontrado' },
        { status: 404 }
      );
    }

    // 2. Cargar configuración de la empresa para acciones móviles DeCA
    const decaConfig = await resolveCompanyDecaConfig(supabase, deca);

    if (body.action === 'sign' && !decaConfig.permitir_firma_movil) {
      return NextResponse.json(
        { error: 'La empresa ha deshabilitado la firma móvil para este DeCA.' },
        { status: 403 }
      );
    }
    if (body.action === 'report_ticket' && !decaConfig.permitir_subida_ticket) {
      return NextResponse.json(
        { error: 'La empresa ha deshabilitado la subida de tickets/incidencias.' },
        { status: 403 }
      );
    }
    if (body.action === 'finalize' && !decaConfig.permitir_finalizar_movil) {
      return NextResponse.json(
        { error: 'La empresa ha deshabilitado la finalización desde móvil.' },
        { status: 403 }
      );
    }

    // 3. Verificar identidad del conductor si la empresa lo exige
    const provided = normalizeVerification(body.driverDniOrPin);
    if (decaConfig.requerir_dni_conductor) {
      if (!provided) {
        return NextResponse.json(
          { error: 'Introduce tu DNI o PIN de conductor para confirmar la acción.' },
          { status: 401 }
        );
      }

      let verified = false;
      if (deca.conductor_dni && normalizeVerification(deca.conductor_dni) === provided) {
        verified = true;
      }

      if (!verified) {
        const { data: drivers } = await supabase
          .from('carrier_drivers')
          .select('id, dni, nombre')
          .eq('user_id', deca.user_id)
          .eq('activo', true);

        if (drivers && drivers.length > 0) {
          verified = drivers.some(
            (d) => d.dni && normalizeVerification(d.dni) === provided
          );
        } else if (!deca.conductor_dni && provided.length >= 4) {
          verified = true;
        }
      }

      if (!verified) {
        return NextResponse.json(
          { error: 'DNI o PIN de conductor no válido para este transporte.' },
          { status: 403 }
        );
      }
    }

    const nowIso = new Date().toISOString();

    if (body.action === 'sign') {
      if (!body.signatureDataUrl) {
        return NextResponse.json(
          { error: 'La firma en pantalla es obligatoria.' },
          { status: 400 }
        );
      }

      const { error: updateDecaErr } = await supabase
        .from('deca_documents')
        .update({
          firma_conductor_url: body.signatureDataUrl,
          fecha_firma_conductor: nowIso,
          conductor_nombre: body.driverName || deca.conductor_nombre,
          conductor_dni: deca.conductor_dni || provided || null,
          updated_at: nowIso,
        })
        .eq('id', deca.id);

      if (updateDecaErr) {
        throw new Error(updateDecaErr.message);
      }

      if (deca.identification_document_id) {
        await supabase
          .from('identification_documents')
          .update({
            firmado_transportista: true,
            firma_transportista_url: body.signatureDataUrl,
            nombre_transportista: body.driverName || deca.conductor_nombre || 'Conductor',
            dni_transportista: deca.conductor_dni || provided || null,
            fecha_firma_transportista: nowIso,
          })
          .eq('id', deca.identification_document_id);
      }

      await supabase.from('deca_audit_logs').insert({
        deca_id: deca.id,
        user_id: deca.user_id,
        accion: 'cambio_estado',
        version_resultante: deca.version,
        detalles: { evento: 'firma_conductor_movil', dni_o_pin: provided || 'no_requerido' },
        created_at: nowIso,
      });

      return NextResponse.json({ ok: true, message: 'Firma registrada correctamente.' });
    }

    if (body.action === 'report_ticket') {
      const storedTicketUrl = body.ticketDataUrl
        ? await uploadTicketToStorage(supabase, deca.id, body.ticketDataUrl)
        : undefined;

      const { error: ticketErr } = await supabase
        .from('deca_documents')
        .update({
          ...(storedTicketUrl ? { ticket_bascula_url: storedTicketUrl } : {}),
          ...(body.incidentNote ? { incidencia_movil: body.incidentNote } : {}),
          updated_at: nowIso,
        })
        .eq('id', deca.id);

      if (ticketErr) {
        throw new Error(ticketErr.message);
      }

      await supabase.from('deca_audit_logs').insert({
        deca_id: deca.id,
        user_id: deca.user_id,
        accion: 'cambio_estado',
        version_resultante: deca.version,
        detalles: {
          evento: 'evidencia_movil',
          tiene_ticket: Boolean(storedTicketUrl),
          incidencia: body.incidentNote || null,
        },
        created_at: nowIso,
      });

      return NextResponse.json({
        ok: true,
        message: 'Ticket / incidencia registrados correctamente.',
      });
    }

    if (body.action === 'finalize') {
      const { error: finErr } = await supabase
        .from('deca_documents')
        .update({
          estado: 'finalizado',
          fecha_finalizacion: nowIso,
          hora_cierre: new Date().toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          }),
          updated_at: nowIso,
        })
        .eq('id', deca.id);

      if (finErr) {
        throw new Error(finErr.message);
      }

      await supabase.from('deca_audit_logs').insert({
        deca_id: deca.id,
        user_id: deca.user_id,
        accion: 'finalizacion',
        version_resultante: deca.version,
        detalles: { origen: 'movil_conductor', dni_o_pin: provided || 'no_requerido' },
        created_at: nowIso,
      });

      return NextResponse.json({
        ok: true,
        message: 'Servicio finalizado correctamente.',
      });
    }

    return NextResponse.json({ error: 'Acción no soportada' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Error interno del servidor';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
