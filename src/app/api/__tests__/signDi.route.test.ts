/**
 * @jest-environment node
 */
import { GET, POST } from '../public/sign-di/route';
import identificationDocumentService from '@/services/identificationDocumentService';

jest.mock('@/services/identificationDocumentService', () => ({
  __esModule: true,
  default: {
    getBySigningToken: jest.fn(),
    signDocumentByToken: jest.fn(),
  },
}));

jest.mock('@/lib/rateLimit', () => ({
  rateLimit: jest.fn(() => true),
  clientIp: jest.fn(() => '127.0.0.1'),
}));

const req = (url: string, init?: RequestInit) => new Request(url, init);

describe('/api/public/sign-di', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('GET', () => {
    it('devuelve 400 si falta el token', async () => {
      const res = await GET(req('http://localhost/api/public/sign-di'));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Token de firma no proporcionado');
    });

    it('devuelve 404 si el documento no existe', async () => {
      (identificationDocumentService.getBySigningToken as jest.Mock).mockResolvedValue(null);
      const res = await GET(req('http://localhost/api/public/sign-di?token=uuid-not-found'));
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.error).toContain('enlace de firma es inválido');
    });

    it('devuelve 410 si el token ha expirado', async () => {
      const pastDate = new Date(Date.now() - 3600_000).toISOString();
      (identificationDocumentService.getBySigningToken as jest.Mock).mockResolvedValue({
        id: 1,
        numero_documento: 'DI-001',
        signing_token_expires_at: pastDate,
      });

      const res = await GET(req('http://localhost/api/public/sign-di?token=uuid-expired'));
      expect(res.status).toBe(410);
      const json = await res.json();
      expect(json.error).toContain('caducado');
    });

    it('devuelve 200 con el documento si el token es válido', async () => {
      const futureDate = new Date(Date.now() + 3600_000).toISOString();
      (identificationDocumentService.getBySigningToken as jest.Mock).mockResolvedValue({
        id: 1,
        numero_documento: 'DI-001',
        signing_token_expires_at: futureDate,
      });

      const res = await GET(req('http://localhost/api/public/sign-di?token=uuid-valid'));
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.document.numero_documento).toBe('DI-001');
    });

    it('devuelve 500 si ocurre un error inesperado', async () => {
      (identificationDocumentService.getBySigningToken as jest.Mock).mockRejectedValue(new Error('DB failure'));
      const res = await GET(req('http://localhost/api/public/sign-di?token=uuid-error'));
      expect(res.status).toBe(500);
      const json = await res.json();
      expect(json.error).toBe('DB failure');
    });
  });

  describe('POST', () => {
    it('devuelve 400 si el cuerpo no es válido', async () => {
      const res = await POST(req('http://localhost/api/public/sign-di', {
        method: 'POST',
        body: 'invalid-json',
      }));
      expect(res.status).toBe(400);
    });

    it('devuelve 400 si falta el token', async () => {
      const res = await POST(req('http://localhost/api/public/sign-di', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: 'transportista', signatureBase64: 'abc', signerName: 'Juan' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Token de firma');
    });

    it('devuelve 400 si el rol no es válido', async () => {
      const res = await POST(req('http://localhost/api/public/sign-di', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'tok-1', role: 'invalido', signatureBase64: 'abc', signerName: 'Juan' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('Rol de firmante no válido');
    });

    it('devuelve 400 si falta la firma gráfica', async () => {
      const res = await POST(req('http://localhost/api/public/sign-di', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'tok-1', role: 'transportista', signerName: 'Juan' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('trazo manuscrito');
    });

    it('devuelve 400 si falta el nombre del firmante', async () => {
      const res = await POST(req('http://localhost/api/public/sign-di', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: 'tok-1', role: 'transportista', signatureBase64: 'data:img', signerName: '  ' }),
      }));
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.error).toContain('nombre y apellidos');
    });

    it('devuelve 200 al registrar correctamente la firma', async () => {
      (identificationDocumentService.signDocumentByToken as jest.Mock).mockResolvedValue({
        id: 1,
        numero_documento: 'DI-001',
        firmado_transportista: true,
      });

      const res = await POST(req('http://localhost/api/public/sign-di', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: 'tok-1',
          role: 'transportista',
          signatureBase64: 'data:image/png;base64,123',
          signerName: 'Pedro Pérez',
          signerDni: '12345678Z',
        }),
      }));

      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.message).toContain('transportista registrada con éxito');
      expect(identificationDocumentService.signDocumentByToken).toHaveBeenCalledWith(
        'tok-1',
        'transportista',
        'data:image/png;base64,123',
        { nombre: 'Pedro Pérez', dni: '12345678Z' }
      );
    });
  });
});
