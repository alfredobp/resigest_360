// ==============================================================================
// RESIGEST 360 - ENDPOINT DE INSPECCIÓN OFICIAL DeCA (DESCARGA DIRECTA SIN LOGIN)
// Cumplimiento: Resolución de 5 de junio de 2026 y Orden FOM/2861/2012
// "Al acceder a esa URL durante una inspección, el PDF debe descargarse directamente,
// sin pantalla de inicio de sesión ni pulsaciones adicionales."
// ==============================================================================

import { type NextRequest, NextResponse } from 'next/server';
import { createClient as createAdminClient } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/server';
import { decaService } from '@/services/decaService';
import { generateDecaPDF } from '@/lib/pdfUtils';
import type { DecaDocument } from '@/types/deca';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await context.params;

    if (!token) {
      return NextResponse.json(
        { error: 'Token de inspección no proporcionado' },
        { status: 400 }
      );
    }

    const supabase = await createClient();
    let deca: DecaDocument | null = null;

    if (typeof (supabase as any).rpc === 'function') {
      const rpcRes = await (supabase as any).rpc('get_deca_by_token', { p_token: token });
      if (rpcRes && !rpcRes.error) {
        const doc = Array.isArray(rpcRes.data) ? rpcRes.data[0] : rpcRes.data;
        deca = (doc as DecaDocument | null) || null;
      }
    } else {
      const { data } = await supabase
        .from('deca_documents')
        .select('*')
        .eq('token', token)
        .maybeSingle();
      deca = (data as DecaDocument | null) || null;
    }

    if (!deca) {
      return new Response(
        `<!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Documento no encontrado - RESIGEST 360</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 480px; text-align: center; }
            h1 { color: #dc2626; font-size: 1.25rem; margin-bottom: 0.5rem; }
            p { font-size: 0.95rem; color: #64748b; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Documento de Control no encontrado</h1>
            <p>El código o identificador facilitado no corresponde a ningún Documento Electrónico de Control Administrativo (DeCA) registrado en la plataforma.</p>
          </div>
        </body>
        </html>`,
        { status: 404, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Comprobar caducidad de la URL pública de inspección (7 días tras finalización)
    if (decaService.isTokenExpired(deca)) {
      return new Response(
        `<!DOCTYPE html>
        <html lang="es">
        <head>
          <meta charset="UTF-8">
          <title>Enlace de inspección caducado - RESIGEST 360</title>
          <style>
            body { font-family: system-ui, sans-serif; display: flex; align-items: center; justify-content: center; height: 100vh; margin: 0; background: #f8fafc; color: #1e293b; }
            .card { background: white; padding: 2rem; border-radius: 8px; box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1); max-width: 480px; text-align: center; }
            h1 { color: #ea580c; font-size: 1.25rem; margin-bottom: 0.5rem; }
            p { font-size: 0.95rem; color: #64748b; line-height: 1.5; }
          </style>
        </head>
        <body>
          <div class="card">
            <h1>Enlace de Inspección Caducado</h1>
            <p>De conformidad con la Resolución de 5 de junio de 2026, la URL pública de inspección del DeCA se desactiva transcurridos siete días naturales desde la finalización del transporte.</p>
            <p>El documento permanece custodiado en el archivo histórico de la empresa durante el plazo legal de conservación aplicable.</p>
          </div>
        </body>
        </html>`,
        { status: 410, headers: { 'Content-Type': 'text/html; charset=utf-8' } }
      );
    }

    // Registrar en auditoría la descarga por inspección
    const ip = request.headers.get('x-forwarded-for') || request.headers.get('remote-addr') || 'desconocida';
    const userAgent = request.headers.get('user-agent') || 'desconocido';
    try {
      await supabase.from('deca_audit_logs').insert({
        deca_id: deca.id,
        user_id: deca.user_id || null,
        accion: 'inspeccion_descarga',
        version_resultante: deca.version,
        detalles: { ip, userAgent },
        created_at: new Date().toISOString(),
      });
    } catch (auditErr) {
      console.warn('Advertencia al registrar auditoría DeCA en servidor:', auditErr);
    }

    // Generar el PDF oficial digital nativo
    const host = request.headers.get('host') || 'resigest.com';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const inspectionUrl = `${protocol}://${host}/api/deca/${token}`;

    // INC12: Si es v2+, recuperar la marca temporal original de v1 para no atribuir la hora de v2 a v1.
    // Usamos previous_version_id o la RPC SECURITY DEFINER get_deca_by_token si no hay sesión autenticada.
    let firstVersionCreatedAt: string | null = null;
    if (deca.version > 1 && deca.numero_deca) {
      try {
        const baseNumero = deca.numero_deca.replace(/-v\d+$/i, '');
        const { data: v1Row } = await supabase
          .from('deca_documents')
          .select('created_at')
          .eq('numero_deca', baseNumero)
          .eq('version', 1)
          .maybeSingle();
        if (v1Row?.created_at) {
          firstVersionCreatedAt = v1Row.created_at;
        } else if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
          const adminSb = createAdminClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY,
            { auth: { persistSession: false, autoRefreshToken: false } }
          );
          const { data: adminV1 } = await adminSb
            .from('deca_documents')
            .select('created_at')
            .eq('user_id', deca.user_id)
            .eq('numero_deca', baseNumero)
            .eq('version', 1)
            .order('created_at', { ascending: true })
            .limit(1)
            .maybeSingle();
          if (adminV1?.created_at) {
            firstVersionCreatedAt = adminV1.created_at;
          }
        }
      } catch {
        // Fallback seguro: generateDecaPDF omitirá v1 si no se pudo recuperar
      }
    }

    const pdfDoc = await generateDecaPDF(deca, inspectionUrl, { firstVersionCreatedAt });
    const pdfArrayBuffer = pdfDoc.output('arraybuffer');
    const pdfBuffer = Buffer.from(pdfArrayBuffer);

    // Servir directamente como application/pdf nativo para los agentes
    const filename = `${deca.numero_deca || 'DECA'}_v${deca.version}.pdf`;

    return new Response(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${filename}"`,
        'Content-Length': pdfBuffer.byteLength.toString(),
        'Cache-Control': 'private, no-store',
      },
    });
  } catch (error: any) {
    console.error('Error sirviendo PDF DeCA para inspección:', error);
    return NextResponse.json(
      { error: 'Error interno al generar el documento de inspección' },
      { status: 500 }
    );
  }
}
