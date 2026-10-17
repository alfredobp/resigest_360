import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, company, email, phone, role, volume, message } = body;

    if (!name || !email) {
      return NextResponse.json(
        { error: 'El nombre y correo electrónico son obligatorios.' },
        { status: 400 }
      );
    }

    // Registro comercial para seguimiento de leads de ventas
    console.log('[LEAD COMERCIAL RECIBIDO - RESIGEST 360]:', {
      fecha: new Date().toISOString(),
      nombre: name,
      empresa: company || 'No especificada',
      email,
      telefono: phone || 'No especificado',
      perfil: role || 'General',
      volumen: volume || 'No especificado',
      mensaje: message || 'Sin comentarios adicionales',
    });

    return NextResponse.json({
      success: true,
      message: '¡Gracias por contactar con Resigest 360! Nos pondremos en contacto contigo en menos de 24 horas laborables.',
    });
  } catch (error) {
    console.error('Error al procesar el contacto comercial:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.' },
      { status: 500 }
    );
  }
}
