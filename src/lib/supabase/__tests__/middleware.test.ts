import { updateSession, PUBLIC_API_PREFIXES } from '../middleware';
import { createServerClient } from '@supabase/ssr';
import { NextRequest } from 'next/server';

jest.mock('@supabase/ssr', () => ({
  createServerClient: jest.fn(),
}));

describe('Supabase Middleware updateSession', () => {
  const originalUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const originalAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  let mockGetUser: jest.Mock;
  let capturedCookiesConfig: any;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key-123';
    mockGetUser = jest.fn();
    capturedCookiesConfig = null;

    (createServerClient as jest.Mock).mockImplementation((_url, _key, options) => {
      capturedCookiesConfig = options.cookies;
      return {
        auth: {
          getUser: mockGetUser,
        },
      };
    });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = originalUrl;
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = originalAnonKey;
  });

  it('debe exportar los prefijos publicos de API esperados', () => {
    expect(PUBLIC_API_PREFIXES).toContain('/api/contact');
    expect(PUBLIC_API_PREFIXES).toContain('/api/deca/');
  });

  it('debe continuar sin crear cliente si faltan variables de entorno de Supabase', async () => {
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});

    const req = new NextRequest('https://resigest360.com/app');
    const res = await updateSession(req);

    expect(createServerClient).not.toHaveBeenCalled();
    expect(res.status).toBe(200);
    consoleSpy.mockRestore();
  });

  it('debe devolver 401 JSON para rutas /api/* protegidas cuando no hay usuario', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('https://resigest360.com/api/holded');
    const res = await updateSession(req);

    expect(res.status).toBe(401);
    const body = await res.json();
    expect(body.error).toContain('No autorizado');
  });

  it('debe permitir rutas /api/* publicas (/api/contact y /api/deca/*) sin sesion', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const contactReq = new NextRequest('https://resigest360.com/api/contact');
    const contactRes = await updateSession(contactReq);
    expect(contactRes.status).toBe(200);

    const decaReq = new NextRequest('https://resigest360.com/api/deca/token-123');
    const decaRes = await updateSession(decaReq);
    expect(decaRes.status).toBe(200);
  });

  it('debe redirigir a /signin con redirectedFrom cuando un usuario no autenticado accede a ruta privada', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const req = new NextRequest('https://resigest360.com/residuos/contratos');
    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toBe(
      'https://resigest360.com/signin?redirectedFrom=%2Fresiduos%2Fcontratos'
    );
  });

  it('debe permitir acceso sin sesion a rutas publicas (/, /signin, /signup, /public/*, /mobile/deca/*)', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });

    const publicPaths = [
      'https://resigest360.com/',
      'https://resigest360.com/signin',
      'https://resigest360.com/signup',
      'https://resigest360.com/public/sign-contract/tok-1',
      'https://resigest360.com/mobile/deca/tok-2',
    ];

    for (const url of publicPaths) {
      const req = new NextRequest(url);
      const res = await updateSession(req);
      expect(res.status).toBe(200);
    }
  });

  it('debe redirigir a /app si el usuario ya esta autenticado e intenta acceder a /, /signin o /signup', async () => {
    mockGetUser.mockResolvedValue({
      data: { user: { id: 'user-123', email: 'test@resigest.es' } },
      error: null,
    });

    for (const path of ['/', '/signin', '/signup']) {
      const req = new NextRequest(`https://resigest360.com${path}`);
      const res = await updateSession(req);
      expect(res.status).toBe(307);
      expect(res.headers.get('location')).toBe('https://resigest360.com/app');
    }
  });

  it('debe permitir acceso a rutas privadas y sincronizar cookies cuando el usuario esta autenticado', async () => {
    mockGetUser.mockImplementation(async () => {
      if (capturedCookiesConfig) {
        capturedCookiesConfig.getAll();
        capturedCookiesConfig.setAll([
          { name: 'sb-access-token', value: 'token-val', options: { path: '/' } },
        ]);
      }
      return {
        data: { user: { id: 'user-123' } },
        error: null,
      };
    });

    const req = new NextRequest('https://resigest360.com/residuos/contratos');
    const res = await updateSession(req);

    expect(res.status).toBe(200);
    expect(res.cookies.get('sb-access-token')?.value).toBe('token-val');
  });

  it('debe manejar excepciones en supabase.auth.getUser() tratando al usuario como no autenticado', async () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    mockGetUser.mockRejectedValue(new Error('Network failure'));

    const req = new NextRequest('https://resigest360.com/app');
    const res = await updateSession(req);

    expect(res.status).toBe(307);
    expect(res.headers.get('location')).toContain('/signin');
    consoleSpy.mockRestore();
  });
});

