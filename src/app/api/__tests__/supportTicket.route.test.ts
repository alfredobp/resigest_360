/**
 * @jest-environment node
 */
import { POST } from '../support/ticket/route';
import { rateLimit } from '@/lib/rateLimit';
import { sendSupportTicketEmails } from '@/services/emailService';

const mockGetUser = jest.fn();

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
  }),
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => true),
}));

jest.mock('@/services/emailService', () => ({
  sendSupportTicketEmails: jest.fn(),
}));

const makeReq = (body: any) =>
  new Request('http://localhost/api/support/ticket', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/support/ticket', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-1' } }, error: null });
    (rateLimit as jest.Mock).mockReturnValue(true);
    (sendSupportTicketEmails as jest.Mock).mockResolvedValue({
      teamResult: { success: true },
      userResult: { success: true },
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve 401 si el usuario no está autenticado', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    const res = await POST(makeReq({}));
    expect(res.status).toBe(401);
  });

  it('devuelve 429 si el usuario supera el rate limit de creación de tickets', async () => {
    (rateLimit as jest.Mock).mockReturnValue(false);
    const res = await POST(makeReq({}));
    expect(res.status).toBe(429);
  });

  it('devuelve 400 si faltan campos obligatorios en el ticket', async () => {
    const resBadJson = await POST(makeReq('bad-json'));
    expect(resBadJson.status).toBe(400);

    const resInvalid = await POST(makeReq({ name: 'Ana', email: 'ana@test.com' }));
    expect(resInvalid.status).toBe(400);
  });

  it('crea el ticket de soporte, envía emails y devuelve código TICK-2026-XXXX', async () => {
    const res = await POST(
      makeReq({
        name: 'Carlos Ruiz',
        email: 'carlos@empresa.es',
        company: 'Residuos Sur S.L.',
        modulo: 'SIRA',
        priority: 'alta',
        subject: 'Error en envío SOAP SIRA',
        message: 'El certificado devuelve código JA000018 al enviar el DI.',
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.ticketId).toMatch(/^TICK-2026-\d{4}$/);
    expect(sendSupportTicketEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'Carlos Ruiz',
        email: 'carlos@empresa.es',
        subject: 'Error en envío SOAP SIRA',
      })
    );
  });

  it('usa valores por defecto para company, modulo y priority y maneja errores 500', async () => {
    const resOk = await POST(
      makeReq({
        name: 'Carlos Ruiz',
        email: 'carlos@empresa.es',
        subject: 'Consulta general',
        message: 'Pregunta sobre memorias anuales de productor.',
      })
    );
    expect(resOk.status).toBe(200);

    (sendSupportTicketEmails as jest.Mock).mockRejectedValueOnce(new Error('SMTP error'));
    const resErr = await POST(
      makeReq({
        name: 'Carlos Ruiz',
        email: 'carlos@empresa.es',
        subject: 'Consulta general',
        message: 'Pregunta sobre memorias anuales de productor.',
      })
    );
    expect(resErr.status).toBe(500);
  });
});

