import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

type DriverActionType = 'sign' | 'report_ticket' | 'finalize';

interface DriverActionBody {
  action: DriverActionType;
  driverDniOrPin?: string;
  driverName?: string;
  signatureDataUrl?: string;
  ticketDataUrl?: string;
  incidentNote?: string;
}

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

    // 2. Verificar identidad del conductor si el DeCA tiene DNI asignado o conductor en flota con PIN
    const provided = normalizeVerification(body.driverDniOrPin);
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
        .from('fleet_drivers')
        .select('id, dni, pin_acceso, nombre_completo')
        .eq('user_id', deca.user_id)
        .eq('activo', true);

      if (drivers && drivers.length > 0) {
        verified = drivers.some(
          (d) =>
            normalizeVerification(d.dni) === provided ||
            (d.pin_acceso && normalizeVerification(d.pin_acceso) === provided)
        );
      } else if (!deca.conductor_dni && provided.length >= 4) {
        // Si la empresa aún no ha dado de alta conductores en flota ni DNI en el DeCA,
        // exigimos al menos un identificador/DNI de >= 4 caracteres que queda auditado.
        verified = true;
      }
    }

    if (!verified) {
      return NextResponse.json(
        { error: 'DNI o PIN de conductor no válido para este transporte.' },
        { status: 403 }
      );
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
          conductor_dni: deca.conductor_dni || provided,
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
            dni_transportista: deca.conductor_dni || provided,
            fecha_firma_transportista: nowIso,
          })
          .eq('id', deca.identification_document_id);
      }

      await supabase.from('deca_audit_logs').insert({
        deca_id: deca.id,
        user_id: deca.user_id,
        accion: 'cambio_estado',
        version_resultante: deca.version,
        detalles: { evento: 'firma_conductor_movil', dni_o_pin: provided },
        created_at: nowIso,
      });

      return NextResponse.json({ ok: true, message: 'Firma registrada correctamente.' });
    }

    if (body.action === 'report_ticket') {
      const { error: ticketErr } = await supabase
        .from('deca_documents')
        .update({
          ...(body.ticketDataUrl ? { ticket_bascula_url: body.ticketDataUrl } : {}),
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
          tiene_ticket: Boolean(body.ticketDataUrl),
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
        detalles: { origen: 'movil_conductor', dni_o_pin: provided },
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
