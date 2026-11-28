import { type NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/rateLimit';

function getAdminClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceRoleKey) {
    return null;
  }
  return createSupabaseAdmin(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

/**
 * POST /api/public/sign-contract
 * Respaldo en servidor para firma gráfica pública de contratos por token (A7-01).
 * Garantiza que la firma se guarde incluso si existen sobrecargas RPC legacy en PostgREST.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    if (!rateLimit(`post-public-sign-contract:${ip}`, 15, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de firma. Espere un minuto antes de reintentar.' },
        { status: 429 }
      );
    }

    const body = await req.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Cuerpo de solicitud inválido.' }, { status: 400 });
    }

    const token = String(body.token || '').trim();
    const role = String(body.role || '').trim();
    const signatureUrl = String(body.signatureUrl || '').trim();

    if (!token || token.length < 16) {
      return NextResponse.json({ error: 'Token de firma inválido.' }, { status: 400 });
    }

    if (role !== 'productor' && role !== 'gestor') {
      return NextResponse.json({ error: 'Rol de firma inválido.' }, { status: 400 });
    }

    if (!signatureUrl) {
      return NextResponse.json({ error: 'Imagen de firma requerida.' }, { status: 400 });
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Servicio de firma en servidor no disponible.' },
        { status: 503 }
      );
    }

    const { data: contract, error: fetchError } = await admin
      .from('waste_contracts')
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*),
        contract_waste_codes(*)
      `)
      .eq('signing_token', token)
      .maybeSingle();

    if (fetchError || !contract) {
      return NextResponse.json(
        { error: 'Contrato no encontrado o enlace de firma caducado.' },
        { status: 404 }
      );
    }

    if (
      contract.signing_token_expires_at &&
      new Date(contract.signing_token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: 'El enlace de firma ha caducado.' },
        { status: 410 }
      );
    }

    if (contract.estado === 'cancelado' || contract.estado === 'finalizado') {
      return NextResponse.json(
        { error: `No se puede firmar un contrato en estado ${contract.estado}.` },
        { status: 409 }
      );
    }

    const alreadySignedProd = Boolean(contract.firmado_productor || contract.firma_productor_url);
    const alreadySignedGest = Boolean(contract.firmado_gestor || contract.firma_gestor_url);

    if (role === 'productor' && alreadySignedProd) {
      return NextResponse.json(
        { error: 'La parte productora ya ha firmado este contrato.' },
        { status: 409 }
      );
    }

    if (role === 'gestor' && alreadySignedGest) {
      return NextResponse.json(
        { error: 'La parte gestora ya ha firmado este contrato.' },
        { status: 409 }
      );
    }

    const nextProd = role === 'productor' ? true : alreadySignedProd;
    const nextGest = role === 'gestor' ? true : alreadySignedGest;
    let nextEstado = contract.estado;
    if (nextProd && nextGest && (contract.estado === 'borrador' || contract.estado === 'pendiente_firma')) {
      nextEstado = 'vigente';
    } else if ((nextProd || nextGest) && contract.estado === 'borrador') {
      nextEstado = 'pendiente_firma';
    }

    const nowIso = new Date().toISOString();
    const updatePayload =
      role === 'productor'
        ? {
            firma_productor_url: signatureUrl,
            fecha_firma_productor: nowIso,
            firmado_productor: true,
            estado: nextEstado,
            updated_at: nowIso,
          }
        : {
            firma_gestor_url: signatureUrl,
            fecha_firma_gestor: nowIso,
            firmado_gestor: true,
            estado: nextEstado,
            updated_at: nowIso,
          };

    const { data: updated, error: updateError } = await admin
      .from('waste_contracts')
      .update(updatePayload)
      .eq('id', contract.id)
      .select(`
        *,
        company:companies!waste_contracts_company_id_fkey(*),
        gestor_company:companies!waste_contracts_gestor_company_id_fkey(*),
        treatment_manager:treatment_managers(*),
        contract_waste_codes(*)
      `)
      .single();

    if (updateError || !updated) {
      return NextResponse.json(
        { error: updateError?.message || 'Error al registrar la firma del contrato.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, contract: updated }, { status: 200 });
  } catch (err: any) {
    return NextResponse.json(
      { error: err?.message || 'Error interno al firmar contrato.' },
      { status: 500 }
    );
  }
}
