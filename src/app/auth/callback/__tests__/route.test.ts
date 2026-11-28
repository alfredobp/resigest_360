import { GET } from '../route';
import { createClient } from '@/lib/supabase/server';

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(),
}));

describe('Auth Callback Route GET /auth/callback', () => {
  const originalEnv = process.env.NODE_ENV;
  let mockExchangeCodeForSession: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockExchangeCodeForSession = jest.fn();
    (createClient as jest.Mock).mockResolvedValue({
      auth: {
        exchangeCodeForSession: mockExchangeCodeForSession,
      },
    });
  });

  afterEach(() => {
    (process.env as any).NODE_ENV = originalEnv;
  });

  it('debe redirigir a /signin?error=auth_code_error si no hay parametro code', async () => {
    const req = new Request('https://resigest360.com/auth/callback');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://resigest360.com/signin?error=auth_code_error');
    expect(createClient).not.toHaveBeenCalled();
  });

  it('debe redirigir a /signin?error=auth_code_error si exchangeCodeForSession falla', async () => {
    mockExchangeCodeForSession.mockResolvedValue({
      error: new Error('Invalid code'),
    });

    const req = new Request('https://resigest360.com/auth/callback?code=bad-code');
    const res = await GET(req);

    expect(mockExchangeCodeForSession).toHaveBeenCalledWith('bad-code');
    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://resigest360.com/signin?error=auth_code_error');
  });

  it('debe redirigir a /app por defecto en entorno development cuando el codigo es valido', async () => {
    (process.env as any).NODE_ENV = 'development';
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const req = new Request('http://localhost:3000/auth/callback?code=valid-code', {
      headers: { 'x-forwarded-host': 'ignored-in-dev.com' },
    });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('http://localhost:3000/app');
  });

  it('debe usar x-forwarded-host en produccion cuando esta presente', async () => {
    (process.env as any).NODE_ENV = 'production';
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const req = new Request('http://internal-lb:3000/auth/callback?code=valid-code&next=/residuos/contratos', {
      headers: { 'x-forwarded-host': 'app.resigest360.es' },
    });
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://app.resigest360.es/residuos/contratos');
  });

  it('debe usar origin en produccion cuando no hay x-forwarded-host', async () => {
    (process.env as any).NODE_ENV = 'production';
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const req = new Request('https://resigest360.com/auth/callback?code=valid-code&next=/residuos');
    const res = await GET(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe('https://resigest360.com/residuos');
  });

  it('debe prevenir Open Redirect cuando el parametro next es externo o malicioso', async () => {
    (process.env as any).NODE_ENV = 'production';
    mockExchangeCodeForSession.mockResolvedValue({ error: null });

    const maliciousUrls = [
      'https://resigest360.com/auth/callback?code=valid&next=//evil.com',
      'https://resigest360.com/auth/callback?code=valid&next=https://evil.com',
      'https://resigest360.com/auth/callback?code=valid&next=/\\evil.com',
    ];

    for (const url of maliciousUrls) {
      const req = new Request(url);
      const res = await GET(req);
      expect(res.headers.get('location')).toBe('https://resigest360.com/app');
    }
  });
});
