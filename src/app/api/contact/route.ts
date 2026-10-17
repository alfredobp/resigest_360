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

    // Envío de correos electrónicos vía Resend (notificación comercial + acuse de recibo)
    const { sendContactEmails } = await import('@/services/emailService');
    await sendContactEmails({
      name,
      email,
      company,
      phone,
      role,
      volume,
      message,
    });

    return NextResponse.json({
      success: true,
      message: '¡Gracias por contactar con Resigest 360! Hemos enviado una confirmación a tu correo y te contactaremos en menos de 24 horas.',
    });
  } catch (error) {
    console.error('Error al procesar el contacto comercial:', error);
    return NextResponse.json(
      { error: 'Ocurrió un error al procesar tu solicitud. Por favor intenta de nuevo.' },
      { status: 500 }
    );
  }
}
