const mockAdminCreateUser = jest.fn();
const mockSignOut = jest.fn();
const mockSignInWithPassword = jest.fn();

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    auth: {
      admin: {
        createUser: mockAdminCreateUser,
      },
    },
  })),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: jest.fn(async () => ({
    auth: {
      signOut: mockSignOut,
      signInWithPassword: mockSignInWithPassword,
    },
  })),
}));

import { NextRequest } from 'next/server';
import { POST, buildFixtureEmail } from '@/app/api/demo/onboarding-fixture/route';

describe('API /api/demo/onboarding-fixture (UXDEV-16)', () => {
  const origEnable = process.env.ENABLE_DEMO_ACCESS;
  const origPublicEnable = process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS;
  const origUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const origServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.ENABLE_DEMO_ACCESS = 'true';
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS = 'true';
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://mock.supabase.co';
    process.env.SUPABASE_SERVICE_ROLE_KEY = 'mock-service-role-key';
  });

  afterEach(() => {
    process.env.ENABLE_DEMO_ACCESS = origEnable;
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS = origPublicEnable;
    process.env.NEXT_PUBLIC_SUPABASE_URL = origUrl;
    process.env.SUPABASE_SERVICE_ROLE_KEY = origServiceKey;
  });

  it('buildFixtureEmail genera direcciones únicas desechables normalizadas', () => {
    const e1 = buildFixtureEmail(1700000000000, 'AbC!12');
    expect(e1).toBe('onboarding-fixture-1700000000000-abc12@resigest.test');
    const e2 = buildFixtureEmail(1700000000000, '!!!');
    expect(e2).toBe('onboarding-fixture-1700000000000-ux16@resigest.test');
  });

  it('devuelve 403 si ENABLE_DEMO_ACCESS está desactivado', async () => {
    process.env.ENABLE_DEMO_ACCESS = 'false';
    process.env.NEXT_PUBLIC_ENABLE_DEMO_ACCESS = 'false';

    const req = new NextRequest('https://resigest.test/api/demo/onboarding-fixture', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(403);
  });

  it('devuelve 503 si falta SUPABASE_SERVICE_ROLE_KEY o URL', async () => {
    delete process.env.SUPABASE_SERVICE_ROLE_KEY;

    const req = new NextRequest('https://resigest.test/api/demo/onboarding-fixture', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(503);
  });

  it('devuelve 500 si falla admin.createUser', async () => {
    mockAdminCreateUser.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Admin quota exceeded' },
    });

    const req = new NextRequest('https://resigest.test/api/demo/onboarding-fixture', {
      method: 'POST',
      body: JSON.stringify({ targetProfile: 'productor' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('Admin quota exceeded');
  });

  it('devuelve 401 si signInWithPassword falla tras crear el usuario desechable', async () => {
    mockAdminCreateUser.mockResolvedValueOnce({
      data: { user: { id: 'fixture-uid-1' } },
      error: null,
    });
    mockSignOut.mockRejectedValueOnce(new Error('no session'));
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: null },
      error: { message: 'Sign-in blocked' },
    });

    const req = new NextRequest('https://resigest.test/api/demo/onboarding-fixture', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('crea una cuenta vacía independiente, inicia sesión, limpia cookie activa y redirige a /onboarding', async () => {
    mockAdminCreateUser.mockResolvedValueOnce({
      data: { user: { id: 'fixture-uid-99' } },
      error: null,
    });
    mockSignOut.mockResolvedValueOnce({});
    mockSignInWithPassword.mockResolvedValueOnce({
      data: { user: { id: 'fixture-uid-99' } },
      error: null,
    });

    const req = new NextRequest('https://resigest.test/api/demo/onboarding-fixture', {
      method: 'POST',
      body: JSON.stringify({ targetProfile: 'productor' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.fixture).toBe(true);
    expect(body.redirectTo).toBe('/onboarding');
    expect(body.email).toMatch(/^onboarding-fixture-\d+-[a-z0-9]+@resigest\.test$/);
    expect(body.email).not.toBe('nuevo.prueba@resigest.test');
    expect(res.cookies.get('resigest_active_company_id')?.value).toBe('');
    expect(mockAdminCreateUser).toHaveBeenCalledWith(
      expect.objectContaining({
        email_confirm: true,
        user_metadata: expect.objectContaining({
          is_onboarding_fixture: true,
          target_profile: 'productor',
          created_for: 'UXDEV-16',
        }),
      })
    );
  });

  it('devuelve 500 si ocurre una excepción inesperada', async () => {
    mockAdminCreateUser.mockRejectedValueOnce(new Error('Network crash'));

    const req = new NextRequest('https://resigest.test/api/demo/onboarding-fixture', {
      method: 'POST',
    });
    const res = await POST(req);
    expect(res.status).toBe(500);
    expect((await res.json()).error).toContain('Network crash');
  });
});

