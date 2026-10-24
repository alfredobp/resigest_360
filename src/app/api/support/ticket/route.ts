import { NextResponse } from 'next/server';
import { sendSupportTicketEmails } from '@/services/emailService';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, email, company, modulo, priority, subject, message } = body;

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: 'Por favor, complete todos los campos obligatorios (nombre, correo, asunto y mensaje).' },
        { status: 400 }
      );
    }

    // Generar código de ticket único con prefijo de año
    const randomCode = Math.floor(1000 + Math.random() * 9000);
    const ticketId = `TICK-2026-${randomCode}`;

    // Envío del ticket tanto a soporte técnico como al cliente
    const emailResult = await sendSupportTicketEmails({
      ticketId,
      name,
      email,
      company: company || '',
      modulo: modulo || 'General',
      priority: priority || 'media',
      subject,
      message,
    });

    console.info(`[TICKET SOPORTE CREADO]: ${ticketId} por ${email}`, {
      teamSent: emailResult.teamResult.success,
      userSent: emailResult.userResult.success,
    });

    return NextResponse.json({
      success: true,
      ticketId,
      message: `Ticket ${ticketId} generado y enviado correctamente. Te hemos enviado un acuse de recibo a tu correo.`,
    });
  } catch (error) {
    console.error('Error al tramitar ticket de soporte:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Ocurrió un error al procesar el ticket de soporte.' },
      { status: 500 }
    );
  }
}
