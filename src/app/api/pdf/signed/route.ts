import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import {
  InvalidPadesSignatureError,
  inspectSignedPdf,
} from '@/lib/pdf/padesInspector';
import {
  MAX_SIGNED_PDF_BYTES,
  SIGNED_ENTITY_TYPES,
  sanitizePdfFileName,
  signedDocumentUploadSchema,
  type SignedEntityType,
} from '@/lib/validations/digitalSignature';

const ENTITY_TABLE_MAP: Record<SignedEntityType, string> = {
  contract: 'waste_contracts',
  di: 'identification_documents',
  deca: 'deca_documents',
  memoria_anual: 'annual_memories',
  commercial_operation: 'commercial_operations',
};

type SupabaseServerClient = Awaited<ReturnType<typeof createClient>>;

async function getAccessibleCompanyIds(
  supabase: SupabaseServerClient,
  userId: string
): Promise<number[]> {
  const [ownedRes, memberRes] = await Promise.all([
    supabase.from('companies').select('id').eq('user_id', userId),
    supabase
      .from('company_memberships')
      .select('company_id')
      .eq('user_id', userId),
  ]);

  const ids = new Set<number>();
  for (const row of ownedRes.data ?? []) {
    if (typeof row.id === 'number') ids.add(row.id);
  }
  for (const row of memberRes.data ?? []) {
    if (typeof row.company_id === 'number') ids.add(row.company_id);
  }
  return Array.from(ids);
}

async function resolveAuthorizedEntityCompanyId(
  supabase: SupabaseServerClient,
  userId: string,
  accessibleCompanyIds: number[],
  entityType: SignedEntityType,
  entityId: string
): Promise<number | null> {
  const tableName = ENTITY_TABLE_MAP[entityType];
  const selectCols =
    entityType === 'contract'
      ? 'id, user_id, company_id, gestor_company_id'
      : 'id, user_id, company_id';
  const { data: entityRow, error } = await supabase
    .from(tableName)
    .select(selectCols)
    .eq('id', entityId)
    .maybeSingle();

  if (error || !entityRow) {
    return null;
  }

  const row = entityRow as unknown as {
    user_id?: string | null;
    company_id?: number | null;
    gestor_company_id?: number | null;
  };
  const rowCompanyId = typeof row.company_id === 'number' ? row.company_id : null;
  const gestorCompanyId = typeof row.gestor_company_id === 'number' ? row.gestor_company_id : null;
  const isOwner = row.user_id === userId;
  const isMember =
    (rowCompanyId !== null && accessibleCompanyIds.includes(rowCompanyId)) ||
    (gestorCompanyId !== null && accessibleCompanyIds.includes(gestorCompanyId));

  if (!isOwner && !isMember) {
    return null;
  }

  return rowCompanyId ?? gestorCompanyId ?? accessibleCompanyIds[0] ?? null;
}

/**
 * GET /api/pdf/signed?entityType=contract&entityId=123
 * Devuelve el historial de PDFs firmados digitalmente para una entidad del tenant.
 */
export async function GET(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere inicio de sesión.' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(req.url);
    const entityType = searchParams.get('entityType') as SignedEntityType | null;
    const entityId = searchParams.get('entityId')?.trim();

    if (
      !entityType ||
      !SIGNED_ENTITY_TYPES.includes(entityType) ||
      !entityId
    ) {
      return NextResponse.json(
        { error: 'Parámetros entityType y entityId inválidos o incompletos.' },
        { status: 400 }
      );
    }

    const accessibleCompanyIds = await getAccessibleCompanyIds(supabase, user.id);
    const companyId = await resolveAuthorizedEntityCompanyId(
      supabase,
      user.id,
      accessibleCompanyIds,
      entityType,
      entityId
    );

    if (companyId === null) {
      return NextResponse.json(
        { error: 'Documento no encontrado o sin permisos en el tenant actual.' },
        { status: 404 }
      );
    }

    const { data: documents, error: listError } = await supabase
      .from('signed_documents')
      .select('*')
      .eq('entity_type', entityType)
      .eq('entity_id', entityId)
      .eq('company_id', companyId)
      .order('signed_at', { ascending: false });

    if (listError) {
      console.error('Error listing signed_documents:', listError);
      return NextResponse.json(
        { error: 'No se pudo consultar el historial de firmas digitales.' },
        { status: 500 }
      );
    }

    return NextResponse.json({ documents: documents ?? [] }, { status: 200 });
  } catch (err) {
    console.error('Unexpected GET /api/pdf/signed error:', err);
    return NextResponse.json(
      { error: 'Error interno al consultar documentos firmados.' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/pdf/signed
 * Recibe un PDF firmado con AutoFirma, verifica la firma PAdES/PKCS#7 y metadatos X.509,
 * lo custodia en el bucket privado `signed-documents` y registra en `signed_documents` + `audit_logs`.
 */
export async function POST(req: NextRequest) {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere inicio de sesión.' },
        { status: 401 }
      );
    }

    const formData = await req.formData();
    const fileEntry = formData.get('file');

    if (!fileEntry || typeof fileEntry === 'string') {
      return NextResponse.json(
        { error: 'Debe adjuntar el archivo PDF firmado.' },
        { status: 400 }
      );
    }

    if (fileEntry.size > MAX_SIGNED_PDF_BYTES) {
      return NextResponse.json(
        { error: 'El PDF firmado supera el límite permitido de 15 MB.' },
        { status: 400 }
      );
    }

    const parsedMeta = signedDocumentUploadSchema.safeParse({
      entityType: formData.get('entityType'),
      entityId: formData.get('entityId'),
      entityVersion: formData.get('entityVersion') ?? 1,
      signerRole: formData.get('signerRole') ?? undefined,
      fileName: formData.get('fileName') || fileEntry.name || 'documento_firmado.pdf',
      originalSha256Hash: formData.get('originalSha256Hash') ?? undefined,
      signatureProvider: formData.get('signatureProvider') ?? 'autofirma',
    });

    if (!parsedMeta.success) {
      return NextResponse.json(
        {
          error: 'Datos de firma inválidos.',
          details: parsedMeta.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const meta = parsedMeta.data;
    const accessibleCompanyIds = await getAccessibleCompanyIds(supabase, user.id);
    const companyId = await resolveAuthorizedEntityCompanyId(
      supabase,
      user.id,
      accessibleCompanyIds,
      meta.entityType,
      meta.entityId
    );

    if (companyId === null) {
      return NextResponse.json(
        { error: 'Entidad no encontrada o sin permisos de escritura en este tenant.' },
        { status: 404 }
      );
    }

    // Bloqueo estricto: cada rol solo puede firmar una única vez (gráfica o digitalmente)
    if (meta.signerRole) {
      if (meta.entityType === 'contract' && (meta.signerRole === 'productor' || meta.signerRole === 'gestor')) {
        const { data: contractCheck } = await supabase
          .from('waste_contracts')
          .select('id, estado, firmado_productor, firmado_gestor')
          .eq('id', meta.entityId)
          .maybeSingle();

        if (contractCheck && (contractCheck.estado === 'cancelado' || contractCheck.estado === 'finalizado')) {
          return NextResponse.json(
            { error: `No se puede firmar un contrato en estado '${contractCheck.estado}'.` },
            { status: 409 }
          );
        }

        if (
          contractCheck &&
          ((meta.signerRole === 'productor' && contractCheck.firmado_productor) ||
            (meta.signerRole === 'gestor' && contractCheck.firmado_gestor))
        ) {
          return NextResponse.json(
            { error: `La parte ${meta.signerRole} ya ha formalizado su firma en este contrato y está bloqueada.` },
            { status: 409 }
          );
        }
      } else if (meta.entityType === 'di') {
        const roleField = `firmado_${meta.signerRole}` as 'firmado_productor' | 'firmado_gestor' | 'firmado_transportista';
        const { data: diCheck } = await supabase
          .from('identification_documents')
          .select(`id, ${roleField}`)
          .eq('id', meta.entityId)
          .maybeSingle();

        if (diCheck && Boolean((diCheck as Record<string, unknown>)[roleField])) {
          return NextResponse.json(
            { error: `La parte ${meta.signerRole} ya ha formalizado su firma en este DI y está bloqueada.` },
            { status: 409 }
          );
        }
      }
    }

    const arrayBuffer = await fileEntry.arrayBuffer();
    const pdfBuffer = Buffer.from(arrayBuffer);

    let inspection;
    try {
      inspection = inspectSignedPdf(pdfBuffer);
    } catch (err) {
      if (err instanceof InvalidPadesSignatureError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }

    const safeFileName = sanitizePdfFileName(meta.fileName);
    const storagePath = `${companyId}/${meta.entityType}/${meta.entityId}/${Date.now()}_${safeFileName}`;

    const { error: uploadError } = await supabase.storage
      .from('signed-documents')
      .upload(storagePath, pdfBuffer, {
        contentType: 'application/pdf',
        upsert: false,
      });

    if (uploadError) {
      console.error('Storage upload error for signed PDF:', uploadError);
      return NextResponse.json(
        {
          error:
            'No se pudo custodiar el PDF firmado en el almacenamiento seguro. Verifica que el bucket signed-documents esté creado.',
        },
        { status: 500 }
      );
    }

    const nowIso = new Date().toISOString();
    const { data: insertedDoc, error: insertError } = await supabase
      .from('signed_documents')
      .insert({
        user_id: user.id,
        company_id: companyId,
        entity_type: meta.entityType,
        entity_id: meta.entityId,
        entity_version: meta.entityVersion,
        storage_path: storagePath,
        file_name: safeFileName,
        file_size_bytes: inspection.fileSizeBytes,
        sha256_hash: inspection.sha256Hash,
        original_sha256_hash: meta.originalSha256Hash ?? null,
        signature_level: inspection.signatureLevel,
        signature_provider: meta.signatureProvider,
        signature_count: inspection.signatureCount,
        signer_cn: inspection.signerCn,
        signer_nif: inspection.signerNif,
        issuer_cn: inspection.issuerCn,
        certificate_serial: inspection.certificateSerial,
        certificate_valid_to: inspection.certificateValidTo,
        signed_at: nowIso,
      })
      .select('*')
      .single();

    if (insertError || !insertedDoc) {
      console.error('Database insert error for signed_documents:', insertError);
      // Limpieza best-effort del binario si falla la inserción en BD
      await supabase.storage.from('signed-documents').remove([storagePath]).catch(() => undefined);
      return NextResponse.json(
        { error: 'No se pudo registrar la custodia del documento firmado.' },
        { status: 500 }
      );
    }

    // Sincronizar estado de firma en la entidad origen si se indicó rol firmante (best-effort)
    if (meta.signerRole) {
      try {
        if (meta.entityType === 'contract' && (meta.signerRole === 'productor' || meta.signerRole === 'gestor')) {
          const { data: existingContract } = await supabase
            .from('waste_contracts')
            .select('id, estado, firmado_productor, firmado_gestor')
            .eq('id', meta.entityId)
            .maybeSingle();

          if (existingContract) {
            const nextProducer = meta.signerRole === 'productor' ? true : Boolean(existingContract.firmado_productor);
            const nextGestor = meta.signerRole === 'gestor' ? true : Boolean(existingContract.firmado_gestor);
            const updatePayload: Record<string, unknown> =
              meta.signerRole === 'productor'
                ? { firmado_productor: true, fecha_firma_productor: nowIso }
                : { firmado_gestor: true, fecha_firma_gestor: nowIso };

            if (nextProducer && nextGestor && (existingContract.estado === 'borrador' || existingContract.estado === 'pendiente_firma')) {
              updatePayload.estado = 'vigente';
            } else if ((nextProducer || nextGestor) && existingContract.estado === 'borrador') {
              updatePayload.estado = 'pendiente_firma';
            }

            await supabase
              .from('waste_contracts')
              .update(updatePayload)
              .eq('id', meta.entityId);
          }
        } else if (meta.entityType === 'di') {
          const role = meta.signerRole;
          const diUpdate: Record<string, unknown> = {
            [`firmado_${role}`]: true,
            [`fecha_firma_${role}`]: nowIso,
          };
          if (inspection.signerCn) {
            diUpdate[`nombre_${role}`] = inspection.signerCn;
          }
          if (inspection.signerNif) {
            diUpdate[`dni_${role}`] = inspection.signerNif;
          }
          await supabase
            .from('identification_documents')
            .update(diUpdate)
            .eq('id', meta.entityId);
        }
      } catch (syncErr) {
        console.warn('No se pudo sincronizar el estado de firma en la entidad:', syncErr);
      }
    }

    // Pista de auditoría (best-effort)
    try {
      await supabase.from('audit_logs').insert({
        user_id: user.id,
        company_id: companyId,
        entidad:
          meta.entityType === 'contract'
            ? 'contrato'
            : meta.entityType === 'commercial_operation'
              ? 'operacion_comercial'
              : meta.entityType,
        entidad_id: meta.entityId,
        accion: 'firmar_pdf_autofirma',
        detalles: {
          signed_document_id: insertedDoc.id,
          signer_role: meta.signerRole ?? null,
          signature_level: inspection.signatureLevel,
          signature_count: inspection.signatureCount,
          signer_cn: inspection.signerCn,
          signer_nif: inspection.signerNif,
          issuer_cn: inspection.issuerCn,
          sha256_hash: inspection.sha256Hash,
        },
      });
    } catch (auditErr) {
      console.warn('No se pudo registrar evento en audit_logs:', auditErr);
    }

    return NextResponse.json({ document: insertedDoc }, { status: 201 });
  } catch (err) {
    console.error('Unexpected POST /api/pdf/signed error:', err);
    return NextResponse.json(
      { error: 'Error interno al procesar el PDF firmado.' },
      { status: 500 }
    );
  }
}

