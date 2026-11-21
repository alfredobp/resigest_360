import { NextResponse } from 'next/server';
import { rateLimit, clientIp } from '@/lib/rateLimit';
import identificationDocumentService from '@/services/identificationDocumentService';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token de firma no proporcionado o inválido.' },
        { status: 400 }
      );
    }

    const ip = clientIp(request.headers);
    if (!rateLimit(`get-sign-di:${ip}`, 30, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Por favor, espere un minuto antes de reintentar.' },
        { status: 429 }
      );
    }

    const doc = await identificationDocumentService.getBySigningToken(token.trim());
    if (!doc) {
      return NextResponse.json(
        { error: 'El enlace de firma es inválido, ha expirado o el Documento de Identificación ya no está disponible.' },
        { status: 404 }
      );
    }

    // Verificar si el enlace ha caducado
    if (doc.signing_token_expires_at && new Date(doc.signing_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'El enlace de firma ha caducado. Solicite un nuevo enlace al emisor del traslado.' },
        { status: 410 }
      );
    }

    const {
      user_id: _hiddenUserId,
      signing_token: _hiddenToken,
      notas: _hiddenNotes,
      ...publicDoc
    } = doc as unknown as Record<string, unknown>;
    void _hiddenUserId;
    void _hiddenToken;
    void _hiddenNotes;

    return NextResponse.json({
      success: true,
      document: publicDoc,
    });
  } catch (error: any) {
    console.error('[API Public Sign DI] Error al consultar DI por token:', error);
    return NextResponse.json(
      { error: error.message || 'Error al obtener el Documento de Identificación.' },
      { status: 500 }
    );
  }
}

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

    if (
      !/^data:image\/(png|jpeg|jpg|webp);base64,/i.test(signatureBase64) ||
      signatureBase64.length > 2_800_000
    ) {
      return NextResponse.json(
        { error: 'El formato o tamaño de la imagen de firma no es válido (PNG/JPEG/WEBP, máx. 2 MB).' },
        { status: 400 }
      );
    }

    if (!signerName || typeof signerName !== 'string' || !signerName.trim()) {
      return NextResponse.json(
        { error: 'El nombre y apellidos del firmante son obligatorios.' },
        { status: 400 }
      );
    }

    const existingDoc = await identificationDocumentService.getBySigningToken(token.trim());
    if (!existingDoc) {
      return NextResponse.json(
        { error: 'El enlace de firma es inválido o el Documento de Identificación no está disponible.' },
        { status: 404 }
      );
    }
    if (existingDoc.signing_token_expires_at && new Date(existingDoc.signing_token_expires_at) < new Date()) {
      return NextResponse.json(
        { error: 'El enlace de firma ha caducado. Solicite un nuevo enlace al emisor del traslado.' },
        { status: 410 }
      );
    }
    if (existingDoc.estado === 'cancelado' || existingDoc.estado_traslado === 'rechazado_total') {
      return NextResponse.json(
        { error: `No se puede firmar un DI en estado '${existingDoc.estado_traslado || existingDoc.estado}'.` },
        { status: 409 }
      );
    }
    if (
      (role === 'productor' && existingDoc.firmado_productor) ||
      (role === 'transportista' && existingDoc.firmado_transportista) ||
      (role === 'gestor' && existingDoc.firmado_gestor)
    ) {
      return NextResponse.json(
        { error: `La firma de ${role} ya ha sido registrada en este DI y está bloqueada.` },
        { status: 409 }
      );
    }

    const updated = await identificationDocumentService.signDocumentByToken(
      token.trim(),
      role as 'productor' | 'transportista' | 'gestor',
      signatureBase64,
      {
        nombre: signerName.trim(),
        dni: (signerDni || '').trim(),
      }
    );

    const {
      user_id: _hiddenUpdatedUserId,
      signing_token: _hiddenUpdatedToken,
      notas: _hiddenUpdatedNotes,
      ...publicUpdatedDoc
    } = (updated || {}) as unknown as Record<string, unknown>;
    void _hiddenUpdatedUserId;
    void _hiddenUpdatedToken;
    void _hiddenUpdatedNotes;

    return NextResponse.json({
      success: true,
      message: `Firma de ${role} registrada con éxito.`,
      document: publicUpdatedDoc,
    });
  } catch (error: any) {
    console.error('[API Public Sign DI] Error al procesar firma pública:', error);
    return NextResponse.json(
      { error: error.message || 'Error interno al registrar la firma del DI.' },
      { status: error.status || 400 }
    );
  }
}
