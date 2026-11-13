import { NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import identificationDocumentService from '@/services/identificationDocumentService';

export async function POST(request: Request) {
  try {
    const ip = clientIp(request.headers);
    if (!rateLimit(`sign-di:${ip}`, 10, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes de firma. Por favor, espere un minuto antes de reintentar.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    if (!body || typeof body !== 'object') {
      return NextResponse.json({ error: 'Cuerpo de solicitud inválido.' }, { status: 400 });
    }

    const { token, role, signatureBase64, signerName, signerDni } = body;

    if (!token || typeof token !== 'string') {
      return NextResponse.json({ error: 'Token de firma no proporcionado o inválido.' }, { status: 400 });
    }

    if (!role || !['productor', 'transportista', 'gestor'].includes(role)) {
      return NextResponse.json(
        { error: "Rol de firmante no válido. Debe ser 'productor', 'transportista' o 'gestor'." },
        { status: 400 }
      );
    }

    if (!signatureBase64 || typeof signatureBase64 !== 'string') {
      return NextResponse.json({ error: 'El trazo manuscrito de firma es obligatorio.' }, { status: 400 });
    }

    if (!signerName || typeof signerName !== 'string' || !signerName.trim()) {
      return NextResponse.json(
        { error: 'El nombre y apellidos del firmante son obligatorios.' },
        { status: 400 }
      );
    }

    const updated = await identificationDocumentService.signDocumentByToken(
      token,
      role as 'productor' | 'transportista' | 'gestor',
      signatureBase64,
      {
        nombre: signerName.trim(),
        dni: (signerDni || '').trim(),
      }
    );

    return NextResponse.json({
      success: true,
      message: `Firma de ${role} registrada con éxito.`,
      document: updated,
    });
  } catch (error: any) {
    console.error('[API Public Sign DI] Error al procesar firma pública:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al registrar la firma del DI.' },
      { status: error.status || 400 }
    );
  }
}

