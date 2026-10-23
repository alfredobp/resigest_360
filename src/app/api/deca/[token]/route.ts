// ==============================================================================
// RESIGEST 360 - ENDPOINT DE INSPECCIÓN OFICIAL DeCA (DESCARGA DIRECTA SIN LOGIN)
// Cumplimiento: Resolución de 5 de junio de 2026 y Orden FOM/2861/2012
// "Al acceder a esa URL durante una inspección, el PDF debe descargarse directamente,
// sin pantalla de inicio de sesión ni pulsaciones adicionales."
// ==============================================================================

import { NextRequest, NextResponse } from 'next/server';
import { decaService } from '@/services/decaService';
import { generateDecaPDF } from '@/lib/pdfUtils';

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

    const deca = await decaService.getByToken(token);

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
    decaService.logAudit(deca.id, 'inspeccion_descarga', deca.version, { ip, userAgent });

    // Generar el PDF oficial digital nativo
    const host = request.headers.get('host') || 'resigest.com';
    const protocol = request.headers.get('x-forwarded-proto') || 'https';
    const inspectionUrl = `${protocol}://${host}/api/deca/${token}`;

    const pdfDoc = await generateDecaPDF(deca, inspectionUrl);
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
        'Cache-Control': 'public, max-age=600',
      },
    });
  } catch (error: any) {
    console.error('Error sirviendo PDF DeCA para inspección:', error);
    return NextResponse.json(
      { error: 'Error interno al generar el documento de inspección', details: error.message },
      { status: 500 }
    );
  }
}
