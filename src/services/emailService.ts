import { Resend } from 'resend';

// Inicialización de Resend (servidor)
const resendApiKey = process.env.RESEND_API_KEY;
const resend = resendApiKey ? new Resend(resendApiKey) : null;

const DEFAULT_FROM = process.env.RESEND_FROM_EMAIL || 'Resigest 360 <onboarding@resend.dev>';
const ADMIN_EMAIL = process.env.NOTIFICATION_ADMIN_EMAIL || 'soporte@resigest360.com';

export interface EmailAttachment {
  filename: string;
  content: string | Buffer;
  contentType?: string;
}

export interface SendEmailOptions {
  to: string | string[];
  subject: string;
  html: string;
  text?: string;
  from?: string;
  replyTo?: string;
  attachments?: EmailAttachment[];
}

export interface SendEmailResult {
  success: boolean;
  id?: string;
  simulated?: boolean;
  error?: string;
}

/**
 * Función central para enviar correos electrónicos usando Resend.
 * Si no hay RESEND_API_KEY configurada, realiza una simulación segura con logs en consola.
 */
export async function sendEmail(options: SendEmailOptions): Promise<SendEmailResult> {
  const { to, subject, html, text, from = DEFAULT_FROM, replyTo, attachments } = options;

  if (!resend) {
    console.warn('[EMAIL SERVICE - MODO SIMULADO]');
    console.warn('Para habilitar el envío real, añade RESEND_API_KEY en tu archivo .env.local');
    console.warn(`Destinatario: ${Array.isArray(to) ? to.join(', ') : to}`);
    console.warn(`Asunto: ${subject}`);
    return {
      success: true,
      simulated: true,
      id: `sim_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`,
    };
  }

  try {
    const { data, error } = await resend.emails.send({
      from,
      to,
      subject,
      html,
      text: text || html.replace(/<[^>]*>/g, ''),
      replyTo,
      attachments: attachments?.map(att => ({
        filename: att.filename,
        content: att.content,
        contentType: att.contentType,
      })),
    });

    if (error) {
      console.error('[EMAIL SERVICE ERROR - RESEND]:', error);
      return {
        success: false,
        error: error.message || 'Error al enviar correo mediante Resend',
      };
    }

    return {
      success: true,
      id: data?.id,
    };
  } catch (err: unknown) {
    const errorMsg = err instanceof Error ? err.message : 'Error desconocido al enviar email';
    console.error('[EMAIL SERVICE EXCEPTION]:', err);
    return {
      success: false,
      error: errorMsg,
    };
  }
}

export function escapeHtml(text?: string | null): string {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/* ==========================================================================
   PLANTILLAS Y CORREOS DE CONTACTO COMERCIAL (LEADS)
   ========================================================================== */

export interface ContactLeadData {
  name: string;
  email: string;
  company?: string;
  phone?: string;
  role?: string;
  volume?: string;
  message?: string;
}

/**
 * Procesa el formulario de contacto de la landing:
 * 1. Envía notificación interna al equipo comercial de Resigest 360.
 * 2. Envía un correo de confirmación de recepción al cliente potencial.
 */
export async function sendContactEmails(lead: ContactLeadData) {
  const safeName = escapeHtml(lead.name);
  const safeEmail = escapeHtml(lead.email);
  const safeCompany = escapeHtml(lead.company);
  const safePhone = escapeHtml(lead.phone);
  const safeRole = escapeHtml(lead.role);
  const safeVolume = escapeHtml(lead.volume);
  const safeMessage = escapeHtml(lead.message);

  // 1. Notificación para el equipo comercial de Resigest 360
  const adminHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Nuevo Lead Comercial</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 24px 32px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.5px;">Resigest 360 &bull; Nuevo Lead</h1>
          <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Solicitud de información o demostración comercial</p>
        </div>
        <div style="padding: 32px;">
          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; width: 140px;">Nombre:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Email de contacto:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${safeEmail}" style="color: #059669; text-decoration: none; font-weight: 600;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Teléfono:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${safePhone || 'No indicado'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Empresa:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${safeCompany || 'No indicada'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Perfil de actividad:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${safeRole || 'General'}</td>
            </tr>
            <tr>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Volumen estimado:</td>
              <td style="padding: 10px 0; border-bottom: 1px solid #e2e8f0;">${safeVolume || 'No especificado'}</td>
            </tr>
          </table>

          <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #059669; border-radius: 4px;">
            <div style="font-weight: 600; font-size: 13px; color: #475569; text-transform: uppercase; margin-bottom: 8px;">Mensaje del cliente:</div>
            <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${safeMessage || 'Sin mensaje adicional'}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // 2. Acuse de recibo para el usuario
  const clientHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Gracias por contactar con Resigest 360</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 24px; font-weight: 700;">¡Gracias por contactar con Resigest 360!</h1>
          <p style="margin: 8px 0 0 0; font-size: 15px; opacity: 0.95;">Plataforma Integral de Gestión y Trazabilidad Ambiental de Residuos</p>
        </div>
        <div style="padding: 32px; color: #334155; line-height: 1.6; font-size: 15px;">
          <p>Hola <strong>${safeName}</strong>,</p>
          <p>Hemos recibido correctamente tu solicitud de información sobre Resigest 360. Uno de nuestros consultores especializados en normativa ambiental (Ley 7/2022 y RD 553/2020) se pondrá en contacto contigo en menos de <strong>24 horas laborables</strong>.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 24px 0;">
            <div style="font-size: 13px; font-weight: 700; color: #059669; margin-bottom: 8px; text-transform: uppercase;">Resumen de tu solicitud:</div>
            <ul style="margin: 0; padding-left: 20px; font-size: 14px; color: #475569;">
              ${safeCompany ? `<li><strong>Empresa:</strong> ${safeCompany}</li>` : ''}
              ${safeRole ? `<li><strong>Perfil de actividad:</strong> ${safeRole}</li>` : ''}
              ${safeVolume ? `<li><strong>Volumen estimado:</strong> ${safeVolume}</li>` : ''}
            </ul>
          </div>

          <p>Si tienes alguna consulta urgente mientras tanto, puedes responder directamente a este correo o escribir a <a href="mailto:soporte@resigest360.com" style="color: #059669; font-weight: 600;">soporte@resigest360.com</a>.</p>
          
          <p style="margin-top: 32px; font-size: 14px; color: #64748b;">Atentamente,<br><strong style="color: #0f172a;">Equipo de Resigest 360</strong></p>
        </div>
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          Resigest 360 Soluciones Tecnológicas S.L. &bull; Conforme a la Ley 7/2022 y Real Decreto 553/2020.
        </div>
      </div>
    </body>
    </html>
  `;

  // Envío a equipo interno
  const adminResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[Nuevo Lead Comercial] ${lead.name} - ${lead.company || 'Empresa'}`,
    html: adminHtml,
    replyTo: lead.email,
  });

  // Envío de cortesía al cliente
  const clientResult = await sendEmail({
    to: lead.email,
    subject: 'Hemos recibido tu solicitud en Resigest 360',
    html: clientHtml,
  });

  return { adminResult, clientResult };
}

/* ==========================================================================
   PLANTILLAS Y CORREOS DE TICKETS DE SOPORTE TÉCNICO
   ========================================================================== */

export interface SupportTicketData {
  ticketId: string;
  name: string;
  email: string;
  company?: string;
  modulo: string;
  priority: string;
  subject: string;
  message: string;
}

/**
 * Envía el ticket de soporte al equipo técnico y la confirmación al usuario solicitante.
 */
export async function sendSupportTicketEmails(ticket: SupportTicketData) {
  const safeTicketId = escapeHtml(ticket.ticketId);
  const safeName = escapeHtml(ticket.name);
  const safeEmail = escapeHtml(ticket.email);
  const safeCompany = escapeHtml(ticket.company);
  const safeModulo = escapeHtml(ticket.modulo);
  const safePriority = escapeHtml(ticket.priority);
  const safeSubject = escapeHtml(ticket.subject);
  const safeMessage = escapeHtml(ticket.message);

  const priorityColor =
    ticket.priority === 'alta' ? '#dc2626' : ticket.priority === 'media' ? '#d97706' : '#2563eb';

  // 1. Notificación interna para el equipo de soporte
  const teamHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Nuevo Ticket de Soporte</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: #0f172a; padding: 24px 32px; color: #ffffff;">
          <h1 style="margin: 0; font-size: 20px; font-weight: 700;">Ticket de Soporte: ${safeTicketId}</h1>
          <p style="margin: 4px 0 0 0; font-size: 13px; color: #94a3b8;">Módulo: ${safeModulo}</p>
        </div>
        <div style="padding: 32px;">
          <div style="margin-bottom: 20px;">
            <span style="display: inline-block; padding: 4px 10px; border-radius: 9999px; font-size: 12px; font-weight: 700; text-transform: uppercase; background-color: ${priorityColor}15; color: ${priorityColor};">
              Prioridad: ${safePriority}
            </span>
          </div>

          <table style="width: 100%; border-collapse: collapse; font-size: 14px; color: #334155;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; width: 140px;">Usuario:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${safeName}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Email:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><a href="mailto:${safeEmail}" style="color: #059669;">${safeEmail}</a></td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Empresa:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${safeCompany || 'No indicada'}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600;">Asunto:</td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; font-weight: 600; color: #0f172a;">${safeSubject}</td>
            </tr>
          </table>

          <div style="margin-top: 24px; padding: 16px; background-color: #f8fafc; border-left: 4px solid #0f172a; border-radius: 4px;">
            <div style="font-weight: 600; font-size: 13px; color: #475569; text-transform: uppercase; margin-bottom: 8px;">Descripción:</div>
            <p style="margin: 0; font-size: 14px; color: #1e293b; line-height: 1.6; white-space: pre-wrap;">${safeMessage}</p>
          </div>
        </div>
      </div>
    </body>
    </html>
  `;

  // 2. Acuse de recibo para el usuario con su ticket ID
  const userHtml = `
    <!DOCTYPE html>
    <html lang="es">
    <head><meta charset="UTF-8"><title>Ticket de Soporte Registrado</title></head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #f1f5f9; margin: 0; padding: 24px;">
      <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
        <div style="background: linear-gradient(135deg, #059669 0%, #047857 100%); padding: 32px; color: #ffffff; text-align: center;">
          <h1 style="margin: 0; font-size: 22px; font-weight: 700;">Ticket de Soporte Registrado</h1>
          <p style="margin: 8px 0 0 0; font-size: 14px; opacity: 0.9;">Referencia oficial: <strong>${safeTicketId}</strong></p>
        </div>
        <div style="padding: 32px; color: #334155; line-height: 1.6; font-size: 15px;">
          <p>Estimado/a <strong>${safeName}</strong>,</p>
          <p>Hemos registrado correctamente su solicitud de asistencia técnica en la plataforma Resigest 360. Su consulta ha sido asignada al equipo de ingeniería y soporte ambiental.</p>
          
          <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 18px; margin: 24px 0;">
            <table style="width: 100%; font-size: 14px;">
              <tr><td style="color: #64748b; padding: 4px 0; width: 120px;">Código:</td><td style="font-weight: 700; color: #059669;">${safeTicketId}</td></tr>
              <tr><td style="color: #64748b; padding: 4px 0;">Módulo:</td><td style="color: #1e293b;">${safeModulo}</td></tr>
              <tr><td style="color: #64748b; padding: 4px 0;">Asunto:</td><td style="color: #1e293b;">${safeSubject}</td></tr>
              <tr><td style="color: #64748b; padding: 4px 0;">SLA estimado:</td><td style="color: #1e293b;">Menos de 2 horas laborables</td></tr>
            </table>
          </div>

          <p>Puede responder directamente a este correo para aportar capturas de pantalla, archivos XML e3l o información complementaria.</p>

          <p style="margin-top: 32px; font-size: 14px; color: #64748b;">Atentamente,<br><strong style="color: #0f172a;">Centro de Soporte Técnico &bull; Resigest 360</strong></p>
        </div>
        <div style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 20px; text-align: center; font-size: 12px; color: #94a3b8;">
          Resigest 360 &bull; Teléfono de soporte: +34 900 836 360 &bull; soporte@resigest360.com
        </div>
      </div>
    </body>
    </html>
  `;

  // Enviar a soporte interno
  const teamResult = await sendEmail({
    to: ADMIN_EMAIL,
    subject: `[${ticket.ticketId}] [${ticket.priority.toUpperCase()}] ${ticket.subject}`,
    html: teamHtml,
    replyTo: ticket.email,
  });

  // Enviar al usuario
  const userResult = await sendEmail({
    to: ticket.email,
    subject: `[${ticket.ticketId}] Hemos recibido tu solicitud de soporte - Resigest 360`,
    html: userHtml,
  });

  return { teamResult, userResult };
}
