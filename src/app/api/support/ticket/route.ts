import { NextResponse } from 'next/server';
import { randomInt } from 'crypto';
import { createClient } from '@/lib/supabase/server';
import { sendSupportTicketEmails } from '@/services/emailService';
import { supportTicketSchema } from '@/lib/validations/publicForms';
import { rateLimit } from '@/lib/rateLimit';

export async function POST(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: 'No autorizado. Se requiere inicio de sesión.' },
        { status: 401 }
      );
    }

    if (!rateLimit(`ticket:${user.id}`, 5, 60_000)) {
      return NextResponse.json(
        { error: 'Demasiados tickets en poco tiempo. Inténtalo de nuevo en unos minutos.' },
        { status: 429 }
      );
    }

    const body = await request.json().catch(() => null);
    const parsed = supportTicketSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Por favor, complete todos los campos obligatorios (nombre, correo, asunto y mensaje).' },
        { status: 400 }
      );
    }

    const { name, email, company, modulo, priority, subject, message } = parsed.data;

    // Generar código de ticket único con prefijo de año
    const randomCode = randomInt(1000, 10000);
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
      { error: 'Ocurrió un error al procesar el ticket de soporte.' },
      { status: 500 }
    );
  }
}
