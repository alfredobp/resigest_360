import { NextResponse } from 'next/server';
import { contactFormSchema } from '@/lib/validations/publicForms';
import { rateLimit, clientIp } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    if (!rateLimit(`contact:${clientIp(request.headers)}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiadas solicitudes. Inténtalo de nuevo en unos minutos.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = contactFormSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'El nombre y un correo electrónico válido son obligatorios.' },
        { status: 400 }
      );
    }

    // Honeypot: los bots rellenan "website". Respondemos éxito sin enviar nada.
    if (parsed.data.website) {
      return NextResponse.json({ success: true });
    }

    const { name, company, email, phone, role, volume, message } = parsed.data;

    // Registro comercial para seguimiento de leads de ventas
    console.info('[LEAD COMERCIAL RECIBIDO - RESIGEST 360]:', {
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
