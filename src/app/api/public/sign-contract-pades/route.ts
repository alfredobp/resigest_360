import { type NextRequest, NextResponse } from 'next/server';
import { createClient as createSupabaseAdmin } from '@supabase/supabase-js';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import {
  InvalidPadesSignatureError,
  inspectSignedPdf,
} from '@/lib/pdf/padesInspector';
import {
  MAX_SIGNED_PDF_BYTES,
  sanitizePdfFileName,
} from '@/lib/validations/digitalSignature';

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

async function isDigitalSignatureEnabledForContract(
  admin: NonNullable<ReturnType<typeof getAdminClient>>,
  contract: { company_id: number; gestor_company_id?: number | null; user_id: string }
): Promise<boolean> {
  const { data: primaryComp } = await admin
    .from('companies')
    .select('id, firma_electronica_activa')
    .eq('id', contract.company_id)
    .maybeSingle();

  if (primaryComp?.firma_electronica_activa) {
    return true;
  }

  if (contract.gestor_company_id) {
    const { data: gestorComp } = await admin
      .from('companies')
      .select('id, firma_electronica_activa')
      .eq('id', contract.gestor_company_id)
      .maybeSingle();
    if (gestorComp?.firma_electronica_activa) {
      return true;
    }
  }

  const { data: ownerComp } = await admin
    .from('companies')
    .select('id, firma_electronica_activa')
    .eq('user_id', contract.user_id)
    .eq('is_my_company', true)
    .maybeSingle();

  return Boolean(ownerComp?.firma_electronica_activa);
}

/**
 * GET /api/public/sign-contract-pades?token=<signing_token>[&download=1]
 * Consulta si la empresa del contrato tiene habilitada la firma electrónica (AutoFirma)
 * y devuelve metadatos del último PDF firmado (o lo descarga si download=1 para co-firma/copia).
 */
export async function GET(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    if (!rateLimit(`get-public-contract-pades:${ip}`, 40, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Espere un minuto antes de reintentar.' },
        { status: 429 }
      );
    }

    const { searchParams } = new URL(req.url);
    const token = searchParams.get('token')?.trim();
    const shouldDownload = searchParams.get('download') === '1';

    if (!token) {
      return NextResponse.json(
        { error: 'Token de firma no proporcionado.' },
        { status: 400 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { enabled: false, latestSignedDocument: null },
        { status: 200 }
      );
    }

    const { data: contract, error: contractError } = await admin
      .from('waste_contracts')
      .select('id, company_id, gestor_company_id, user_id, numero_contrato, version, estado, firmado_productor, firmado_gestor, signing_token_expires_at')
      .eq('signing_token', token)
      .maybeSingle();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Enlace de firma inválido o contrato no encontrado.' },
        { status: 404 }
      );
    }

    if (
      contract.signing_token_expires_at &&
      new Date(contract.signing_token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: 'El enlace de firma ha caducado. Solicite uno nuevo al emisor del contrato.' },
        { status: 410 }
      );
    }

    const enabled = await isDigitalSignatureEnabledForContract(admin, contract);

    const { data: latestDocs } = await admin
      .from('signed_documents')
      .select('id, file_name, storage_path, sha256_hash, signature_level, signature_count, signer_cn, signer_nif, issuer_cn, signed_at')
      .eq('entity_type', 'contract')
      .eq('entity_id', String(contract.id))
      .eq('company_id', contract.company_id)
      .order('signed_at', { ascending: false })
      .limit(1);

    const latest = latestDocs && latestDocs.length > 0 ? latestDocs[0] : null;

    if (shouldDownload) {
      if (!latest) {
        return NextResponse.json(
          { error: 'No existe ningún PDF firmado electrónicamente para este contrato.' },
          { status: 404 }
        );
      }

      const { data: fileBlob, error: dlError } = await admin.storage
        .from('signed-documents')
        .download(latest.storage_path);

      if (dlError || !fileBlob) {
        return NextResponse.json(
          { error: 'No se pudo recuperar el PDF firmado del almacenamiento.' },
          { status: 500 }
        );
      }

      const buffer = Buffer.from(await fileBlob.arrayBuffer());
      const safeName = sanitizePdfFileName(latest.file_name || 'contrato_firmado.pdf');
      return new NextResponse(buffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': `attachment; filename="${safeName}"`,
          'X-Document-SHA256': latest.sha256_hash,
          'Cache-Control': 'private, no-store',
        },
      });
    }

    return NextResponse.json(
      {
        enabled,
        latestSignedDocument: latest
          ? {
              id: latest.id,
              file_name: latest.file_name,
              sha256_hash: latest.sha256_hash,
              signature_level: latest.signature_level,
              signature_count: latest.signature_count,
              signer_cn: latest.signer_cn,
              signer_nif: latest.signer_nif,
              issuer_cn: latest.issuer_cn,
              signed_at: latest.signed_at,
            }
          : null,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[API Public Contract PAdES] GET error:', err);
    return NextResponse.json(
      { error: 'Error interno al consultar la firma electrónica del contrato.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/public/sign-contract-pades
 * Recibe un PDF firmado con AutoFirma desde el enlace público de contrato,
 * verifica el token, el flag de empresa, que el rol no esté ya firmado y la firma PKCS#7/X.509.
 */
export async function POST(req: NextRequest) {
  try {
    const ip = clientIp(req.headers);
    if (!rateLimit(`post-public-contract-pades:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de firma. Espere un minuto antes de reintentar.' },
        { status: 429 }
      );
    }

    const admin = getAdminClient();
    if (!admin) {
      return NextResponse.json(
        { error: 'Servicio de firma electrónica pública no configurado en servidor (SUPABASE_SERVICE_ROLE_KEY).' },
        { status: 503 }
      );
    }

    const formData = await req.formData();
    const token = String(formData.get('token') ?? '').trim();
    const role = String(formData.get('role') ?? '').trim() as 'productor' | 'gestor';
    const fileEntry = formData.get('file');
    const originalSha256Hash = String(formData.get('originalSha256Hash') ?? '').trim() || null;

    if (!token) {
      return NextResponse.json({ error: 'Token de firma obligatorio.' }, { status: 400 });
    }

    if (role !== 'productor' && role !== 'gestor') {
      return NextResponse.json(
        { error: "Rol inválido. Debe ser 'productor' o 'gestor'." },
        { status: 400 }
      );
    }

    if (!fileEntry || typeof fileEntry === 'string') {
      return NextResponse.json({ error: 'Debe adjuntar el archivo PDF firmado.' }, { status: 400 });
    }

    if (fileEntry.size > MAX_SIGNED_PDF_BYTES) {
      return NextResponse.json(
        { error: 'El PDF firmado supera el tamaño máximo permitido (15 MB).' },
        { status: 400 }
      );
    }

    const { data: contract, error: contractError } = await admin
      .from('waste_contracts')
      .select('id, company_id, gestor_company_id, user_id, numero_contrato, version, estado, firmado_productor, firmado_gestor, signing_token_expires_at')
      .eq('signing_token', token)
      .maybeSingle();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: 'Enlace de firma inválido o contrato no disponible.' },
        { status: 404 }
      );
    }

    if (
      contract.signing_token_expires_at &&
      new Date(contract.signing_token_expires_at) < new Date()
    ) {
      return NextResponse.json(
        { error: 'El enlace de firma ha caducado. Solicite uno nuevo al emisor del contrato.' },
        { status: 410 }
      );
    }

    if (contract.estado === 'cancelado' || contract.estado === 'finalizado') {
      return NextResponse.json(
        { error: `No se puede firmar un contrato en estado '${contract.estado}'.` },
        { status: 409 }
      );
    }

    const enabled = await isDigitalSignatureEnabledForContract(admin, contract);
    if (!enabled) {
      return NextResponse.json(
        { error: 'La firma electrónica con certificado digital no está habilitada para esta empresa.' },
        { status: 403 }
      );
    }

    // Bloqueo estricto si el rol ya ha firmado (gráfica o digitalmente)
    if (
      (role === 'productor' && contract.firmado_productor) ||
      (role === 'gestor' && contract.firmado_gestor)
    ) {
      return NextResponse.json(
        { error: `La parte ${role} ya ha formalizado su firma en este contrato y está bloqueada.` },
        { status: 409 }
      );
    }

    const pdfBuffer = Buffer.from(await fileEntry.arrayBuffer());
    let inspection;
    try {
      inspection = inspectSignedPdf(pdfBuffer);
    } catch (err) {
      if (err instanceof InvalidPadesSignatureError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const safeFileName = sanitizePdfFileName(
      String(formData.get('fileName') || fileEntry.name || `contrato_${contract.numero_contrato || contract.id}_firmado.pdf`)
    );
    const storagePath = `${contract.company_id}/contract/${contract.id}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await admin.storage
      .from('signed-documents')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('[API Public Contract PAdES] Storage upload error:', uploadError);
      return NextResponse.json(
        { error: 'No se pudo custodiar el PDF firmado en almacenamiento seguro.' },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data: insertedDoc, error: insertError } = await admin
      .from('signed_documents')
      .insert({
        user_id: contract.user_id,
        company_id: contract.company_id,
        entity_type: 'contract',
        entity_id: String(contract.id),
        entity_version: contract.version || 1,
        storage_path: storagePath,
        file_name: safeFileName,
        file_size_bytes: inspection.fileSizeBytes,
        sha256_hash: inspection.sha256Hash,
        original_sha256_hash: originalSha256Hash,
        signature_level: inspection.signatureLevel,
        signature_provider: 'autofirma',
        signature_count: inspection.signatureCount,
        signer_cn: inspection.signerCn,
        signer_nif: inspection.signerNif,
        issuer_cn: inspection.issuerCn,
        certificate_serial: inspection.certificateSerial,
        certificate_valid_to: inspection.certificateValidTo,
        signed_at: nowIso,
      })
      .select('id, file_name, sha256_hash, signature_level, signature_count, signer_cn, signer_nif, issuer_cn, signed_at')
      .single();

    if (insertError || !insertedDoc) {
      await admin.storage.from('signed-documents').remove([storagePath]).catch(() => undefined);
      return NextResponse.json(
        { error: 'No se pudo registrar la custodia del documento firmado.' },
        { status: 500 }
      );
    }

    // Actualizar estado de firma en waste_contracts (y pasar a vigente si ya firmaron ambas partes)
    const nextProducer = role === 'productor' ? true : Boolean(contract.firmado_productor);
    const nextGestor = role === 'gestor' ? true : Boolean(contract.firmado_gestor);
    const contractUpdate: Record<string, unknown> =
      role === 'productor'
        ? { firmado_productor: true, fecha_firma_productor: nowIso }
        : { firmado_gestor: true, fecha_firma_gestor: nowIso };

    if (nextProducer && nextGestor && (contract.estado === 'borrador' || contract.estado === 'pendiente_firma')) {
      contractUpdate.estado = 'vigente';
    } else if ((nextProducer || nextGestor) && contract.estado === 'borrador') {
      contractUpdate.estado = 'pendiente_firma';
    }

    await admin
      .from('waste_contracts')
      .update(contractUpdate)
      .eq('id', contract.id);

    // Pista de auditoría (best-effort)
    try {
      await admin.from('audit_logs').insert({
        user_id: contract.user_id,
        company_id: contract.company_id,
        entidad: 'contrato',
        entidad_id: String(contract.id),
        accion: 'firmar_pdf_autofirma_publico',
        detalles: {
          signed_document_id: insertedDoc.id,
          signer_role: role,
          signer_cn: inspection.signerCn,
          signer_nif: inspection.signerNif,
          issuer_cn: inspection.issuerCn,
          sha256_hash: inspection.sha256Hash,
          ip,
        },
      });
    } catch {
      // No bloquear respuesta si falla auditoría
    }

    return NextResponse.json({ document: insertedDoc }, { status: 201 });
  } catch (err) {
    console.error('[API Public Contract PAdES] POST error:', err);
    return NextResponse.json(
      { error: 'Error interno al procesar la firma electrónica pública.' },
      { status: 500 }
    );
  }
}

