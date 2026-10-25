const mockSend = jest.fn();

jest.mock('resend', () => ({
  Resend: jest.fn().mockImplementation(() => ({
    emails: {
      send: mockSend,
    },
  })),
}));

// Set dummy API key so resend instance is created
process.env.RESEND_API_KEY = 're_test_dummy_key_123';

import {
  sendEmail,
  escapeHtml,
  sendContactEmails,
  sendSupportTicketEmails,
} from '../emailService';

describe('emailService - Envío y Plantillas de Correo', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('escapeHtml', () => {
    it('debe retornar cadena vacía si el texto es nulo o indefinido', () => {
      expect(escapeHtml(null)).toBe('');
      expect(escapeHtml(undefined)).toBe('');
      expect(escapeHtml('')).toBe('');
    });

    it('debe escapar caracteres peligrosos para HTML', () => {
      const unsafe = '<script>alert("XSS & \'attack\'")</script>';
      const safe = escapeHtml(unsafe);
      expect(safe).toBe('&lt;script&gt;alert(&quot;XSS &amp; &#39;attack&#39;&quot;)&lt;/script&gt;');
    });
  });

  describe('sendEmail', () => {
    it('debe enviar un correo con éxito a través de Resend', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-resend-123' },
        error: null,
      });

      const res = await sendEmail({
        to: 'destinatario@test.com',
        subject: 'Asunto de prueba',
        html: '<p>Hola Mundo</p>',
        text: 'Hola Mundo',
        attachments: [
          {
            filename: 'archivo.pdf',
            content: 'dummy-base64',
            contentType: 'application/pdf',
          },
        ],
      });

      expect(res.success).toBe(true);
      expect(res.id).toBe('email-resend-123');
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          to: 'destinatario@test.com',
          subject: 'Asunto de prueba',
          attachments: [
            {
              filename: 'archivo.pdf',
              content: 'dummy-base64',
              contentType: 'application/pdf',
            },
          ],
        })
      );
    });

    it('debe generar texto alternativo plano a partir del html si no se proporciona text', async () => {
      mockSend.mockResolvedValue({
        data: { id: 'email-456' },
        error: null,
      });

      await sendEmail({
        to: ['user1@test.com', 'user2@test.com'],
        subject: 'Prueba sin texto',
        html: '<b>Texto en negrita</b>',
      });

      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          text: 'Texto en negrita',
        })
      );
    });

    it('debe retornar error si Resend devuelve un error', async () => {
      mockSend.mockResolvedValue({
        data: null,
        error: { message: 'Invalid API Key' },
      });

      const res = await sendEmail({
        to: 'fail@test.com',
        subject: 'Fallo',
        html: '<p>Fallo</p>',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Invalid API Key');
    });

    it('debe capturar excepciones no controladas', async () => {
      mockSend.mockRejectedValue(new Error('Network error'));

      const res = await sendEmail({
        to: 'exception@test.com',
        subject: 'Excepción',
        html: '<p>Excepción</p>',
      });

      expect(res.success).toBe(false);
      expect(res.error).toBe('Network error');
    });
  });

  describe('sendContactEmails', () => {
    it('debe enviar la notificación interna y el acuse al cliente con todos los campos', async () => {
      mockSend.mockResolvedValue({ data: { id: 'contact-mail-id' }, error: null });

      const lead = {
        name: 'Carlos Ruiz',
        email: 'carlos@empresa.com',
        company: 'Empresa Demo S.A.',
        phone: '+34 600 000 000',
        role: 'Productor',
        volume: '> 100t/año',
        message: 'Interesado en módulo de archivo cronológico.',
      };

      const { adminResult, clientResult } = await sendContactEmails(lead);

      expect(adminResult.success).toBe(true);
      expect(clientResult.success).toBe(true);
      expect(mockSend).toHaveBeenCalledTimes(2);
    });

    it('debe funcionar correctamente cuando faltan campos opcionales del lead', async () => {
      mockSend.mockResolvedValue({ data: { id: 'lead-min-id' }, error: null });

      const lead = {
        name: 'Ana López',
        email: 'ana@test.com',
      };

      const { adminResult, clientResult } = await sendContactEmails(lead);

      expect(adminResult.success).toBe(true);
      expect(clientResult.success).toBe(true);
    });
  });

  describe('sendSupportTicketEmails', () => {
    it('debe enviar correos para tickets con prioridad alta (#dc2626)', async () => {
      mockSend.mockResolvedValue({ data: { id: 'ticket-mail-id' }, error: null });

      const ticket = {
        ticketId: 'TCK-2025-001',
        name: 'Marta Pérez',
        email: 'marta@test.com',
        company: 'EcoPlanta S.L.',
        modulo: 'DECA',
        priority: 'alta',
        subject: 'Error al firmar documento',
        message: 'No se puede generar el token de firma pública.',
      };

      const { teamResult, userResult } = await sendSupportTicketEmails(ticket);

      expect(teamResult.success).toBe(true);
      expect(userResult.success).toBe(true);
      expect(mockSend).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: '[TCK-2025-001] [ALTA] Error al firmar documento',
        })
      );
    });

    it('debe procesar prioridades media y baja con sus respectivos colores', async () => {
      mockSend.mockResolvedValue({ data: { id: 'ticket-med-id' }, error: null });

      const ticketMedia = {
        ticketId: 'TCK-2025-002',
        name: 'Luis Gómez',
        email: 'luis@test.com',
        modulo: 'Holded',
        priority: 'media',
        subject: 'Duda de sincronización',
        message: '¿Cada cuánto tiempo se sincroniza?',
      };

      await sendSupportTicketEmails(ticketMedia);

      const ticketBaja = {
        ...ticketMedia,
        ticketId: 'TCK-2025-003',
        priority: 'baja',
      };

      await sendSupportTicketEmails(ticketBaja);
      expect(mockSend).toHaveBeenCalledTimes(4); // 2 llamadas por cada ticket
    });
  });
});
