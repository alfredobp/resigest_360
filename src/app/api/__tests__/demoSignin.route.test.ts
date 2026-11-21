const mockSignOut = jest.fn();
const mockSignInWithPassword = jest.fn();

const mockServerSupabase = {
  auth: {
    signOut: mockSignOut,
    signInWithPassword: mockSignInWithPassword,
    getUser: jest.fn(),
  },
};

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => mockServerSupabase),
}));

jest.mock('@/services/tenantContextService', () => ({
  ACTIVE_COMPANY_COOKIE: 'resigest_active_company_id',
  resolveTenantContext: jest.fn(),
}));

import { NextRequest } from 'next/server';
import { POST } from '@/app/api/demo/signin/route';
import { resolveTenantContext } from '@/services/tenantContextService';

describe('API /api/demo/signin', () => {
  const origEnable = process.env.ENABLE_DEMO_ACCESS;
  const origPublicEnable = process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_DEMO_ACCESS = 'true';
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS = 'true';
  });

  afterEach(() => {
    process.env.ENABLE_DEMO_ACCESS = origEnable;
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS = origPublicEnable;
  });

  it('debe devolver 403 cuando ENABLE_DEMO_ACCESS está desactivado', async () => {
    process.env.ENABLE_DEMO_ACCESS = 'false';
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS = 'false';

    const req = new NextRequest('https://resigest.test/api/demo/signin', {
      method: 'POST',
      body: JSON.stringify({ profileKey: 'productor' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('debe devolver 400 si el perfil no existe o el JSON es inválido', async () => {
    const badJsonReq = new NextRequest('https://resigest.test/api/demo/signin', {
      method: 'POST',
      body: 'not-json',
    });
    expect((await POST(badJsonReq)).status).toBe(400);

    const invalidKeyReq = new NextRequest('https://resigest.test/api/demo/signin', {
      method: 'POST',
      body: JSON.stringify({ profileKey: 'inventado' }),
    });
    expect((await POST(invalidKeyReq)).status).toBe(400);
  });

  it('debe devolver 401 si Supabase rechaza las credenciales', async () => {
    mockSignOut.mockResolvedValue({});
    mockSignInWithPassword.mockResolvedValue({
      data: { user: null },
      error: { message: 'Invalid login credentials' },
    });

    const req = new NextRequest('https://resigest.test/api/demo/signin', {
      method: 'POST',
      body: JSON.stringify({ profileKey: 'productor' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('debe iniciar sesión correctamente y redirigir según el contexto del perfil', async () => {
    mockSignOut.mockResolvedValue({});
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'uid-trans', email: 'transportista.prueba@resigest.test' } },
      error: null,
    });
    (resolveTenantContext as jest.Mock).mockResolvedValue({
      hasCompletedOnboarding: true,
      isPlatformAdmin: false,
      homePath: '/app',
    });

    const req = new NextRequest('https://resigest.test/api/demo/signin', {
      method: 'POST',
      body: JSON.stringify({ profileKey: 'transportista' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.redirectTo).toBe('/app');
    expect(res.cookies.get('resigest_active_company_id')?.value).toBe('');
  });

  it('debe redirigir a /onboarding para cliente nuevo sin empresa configurada', async () => {
    mockSignOut.mockResolvedValue({});
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'uid-nuevo', email: 'nuevo.prueba@resigest.test' } },
      error: null,
    });
    (resolveTenantContext as jest.Mock).mockResolvedValue({
      hasCompletedOnboarding: false,
      isPlatformAdmin: false,
      homePath: '/app',
    });

    const req = new NextRequest('https://resigest.test/api/demo/signin', {
      method: 'POST',
      body: JSON.stringify({ profileKey: 'nuevo' }),
    });

    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.redirectTo).toBe('/onboarding');
  });

  it('debe usar el redirect por defecto si resolveTenantContext lanza error y capturar fallos inesperados', async () => {
    mockSignOut.mockResolvedValue({});
    mockSignInWithPassword.mockResolvedValue({
      data: { user: { id: 'uid-prod' } },
      error: null,
    });
    (resolveTenantContext as jest.Mock).mockRejectedValueOnce(new Error('DB lag'));

    const req = new NextRequest('https://resigest.test/api/demo/signin', {
      method: 'POST',
      body: JSON.stringify({ profileKey: 'productor' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect((await res.json()).redirectTo).toBe('/app');

    mockSignInWithPassword.mockRejectedValueOnce(new Error('Supabase down'));
    const failReq = new NextRequest('https://resigest.test/api/demo/signin', {
      method: 'POST',
      body: JSON.stringify({ profileKey: 'gestor' }),
    });
    expect((await POST(failReq)).status).toBe(500);
  });
});

