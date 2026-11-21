import { type NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';
import { sanitizePdfFileName } from '@/lib/validations/digitalSignature';

/**
 * GET /api/pdf/signed/[id]
 * Descarga segura del PDF firmado custodiado verificando aislamiento multi-tenant.
 */
export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params;
    if (!id || !id.trim()) {
      return NextResponse.json(
        { error: 'Identificador de documento firmado no proporcionado.' },
        { status: 400 }
      );
    }

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

    const { data: docRecord, error: fetchError } = await supabase
      .from('signed_documents')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (fetchError || !docRecord) {
      return NextResponse.json(
        { error: 'Documento firmado no encontrado o sin permisos de acceso.' },
        { status: 404 }
      );
    }

    // Verificación explícita multi-tenant además de RLS (incluyendo parte gestora en contratos)
    if (docRecord.user_id !== user.id) {
      let authorizedCompanyIds: number[] = [docRecord.company_id];
      if (docRecord.entity_type === 'contract' && docRecord.entity_id) {
        const { data: contractRow } = await supabase
          .from('waste_contracts')
          .select('gestor_company_id')
          .eq('id', docRecord.entity_id)
          .maybeSingle();
        if (typeof contractRow?.gestor_company_id === 'number') {
          authorizedCompanyIds = [...authorizedCompanyIds, contractRow.gestor_company_id];
        }
      }

      let hasAccess = false;
      for (const cid of authorizedCompanyIds) {
        const [ownedRes, memberRes] = await Promise.all([
          supabase
            .from('companies')
            .select('id')
            .eq('id', cid)
            .eq('user_id', user.id)
            .maybeSingle(),
          supabase
            .from('company_memberships')
            .select('id')
            .eq('company_id', cid)
            .eq('user_id', user.id)
            .maybeSingle(),
        ]);
        if (ownedRes.data || memberRes.data) {
          hasAccess = true;
          break;
        }
      }

      if (!hasAccess) {
        return NextResponse.json(
          { error: 'Sin permisos para descargar este documento firmado.' },
          { status: 403 }
        );
      }
    }

    const { data: fileBlob, error: downloadError } = await supabase.storage
      .from('signed-documents')
      .download(docRecord.storage_path);

    if (downloadError || !fileBlob) {
      console.error('Error downloading signed PDF from storage:', downloadError);
      return NextResponse.json(
        { error: 'No se pudo recuperar el archivo PDF firmado del almacenamiento.' },
        { status: 500 }
      );
    }

    const buffer = Buffer.from(await fileBlob.arrayBuffer());
    const safeFileName = sanitizePdfFileName(docRecord.file_name || 'documento_firmado.pdf');

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${safeFileName}"`,
        'X-Document-SHA256': docRecord.sha256_hash,
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (err) {
    console.error('Unexpected GET /api/pdf/signed/[id] error:', err);
    return NextResponse.json(
      { error: 'Error interno al descargar el documento firmado.' },
      { status: 500 }
    );
  }
}

