/**
 * @jest-environment node
 */
import { POST } from '../contact/route';
import { rateLimit } from '@/lib/rateLimit';
import { sendContactEmails } from '@/services/emailService';

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => true),
  clientIp: jest.fn(() => '127.0.0.1'),
}));

jest.mock('@/services/emailService', () => ({
  sendContactEmails: jest.fn(),
}));

const makeReq = (body: any) =>
  new Request('http://localhost/api/contact', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: typeof body === 'string' ? body : JSON.stringify(body),
  });

describe('POST /api/contact', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, 'info').mockImplementation(() => {});
    jest.spyOn(console, 'error').mockImplementation(() => {});
    (rateLimit as jest.Mock).mockReturnValue(true);
    (sendContactEmails as jest.Mock).mockResolvedValue({ success: true });
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('devuelve 429 cuando se supera el rate limit', async () => {
    (rateLimit as jest.Mock).mockReturnValue(false);
    const res = await POST(makeReq({ name: 'Juan', email: 'juan@empresa.es' }));
    expect(res.status).toBe(429);
  });

  it('devuelve 400 si el cuerpo JSON es inválido o faltan datos obligatorios', async () => {
    const resInvalidJson = await POST(makeReq('no-es-json'));
    expect(resInvalidJson.status).toBe(400);

    const resInvalidData = await POST(makeReq({ name: '', email: 'invalido' }));
    expect(resInvalidData.status).toBe(400);
  });

  it('responde 200 silenciosamente sin enviar emails si el campo honeypot website viene relleno', async () => {
    const res = await POST(
      makeReq({
        name: 'Bot',
        email: 'bot@spam.com',
        website: 'https://spam.com',
      })
    );
    expect(res.status).toBe(200);
    expect(sendContactEmails).not.toHaveBeenCalled();
  });

  it('envía correos comerciales y devuelve 200 con datos válidos', async () => {
    const res = await POST(
      makeReq({
        name: 'María López',
        email: 'maria@ecogest.es',
        company: 'EcoGest S.L.',
        phone: '600123456',
        role: 'gestor',
        volume: '100-500',
        message: 'Solicito demostración',
      })
    );

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(sendContactEmails).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'María López',
        email: 'maria@ecogest.es',
      })
    );
  });

  it('devuelve 500 si el servicio de correo lanza una excepción', async () => {
    (sendContactEmails as jest.Mock).mockRejectedValue(new Error('Resend down'));
    const res = await POST(
      makeReq({
        name: 'María López',
        email: 'maria@ecogest.es',
      })
    );
    expect(res.status).toBe(500);
  });
});

