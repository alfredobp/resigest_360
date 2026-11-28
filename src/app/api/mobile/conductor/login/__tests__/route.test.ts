import { NextRequest } from 'next/server';

const mockFrom = jest.fn();
const mockCheckPremium = jest.fn();
jest.mock('@/lib/auth/premiumGate', () => ({
  checkCompanyPremiumFeature: (...args: unknown[]) => mockCheckPremium(...args),
}));
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import { DELETE, POST } from '../route';
import { DRIVER_SESSION_COOKIE } from '@/lib/auth/driverSession';

describe('/api/mobile/conductor/login', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    mockCheckPremium.mockResolvedValue({ active: true, status: 'premium' });
  });

  it('returns 400 when dni or pin is missing', async () => {
    const req = new NextRequest('http://localhost/api/mobile/conductor/login', {
      method: 'POST',
      body: JSON.stringify({ dni: '' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('returns 401 when driver credentials do not match', async () => {
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn() };
    chain.eq
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: [{ id: 1, dni: '12345678A', pin_acceso: '9999' }], error: null });
    mockFrom.mockReturnValueOnce(chain);

    const req = new NextRequest('http://localhost/api/mobile/conductor/login', {
      method: 'POST',
      body: JSON.stringify({ dni: '12345678A', pin: '1111' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it('sets signed cookie when credentials match and clears on DELETE', async () => {
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn() };
    chain.eq.mockReturnValueOnce(chain).mockResolvedValueOnce({
      data: [
        {
          id: 5,
          user_id: 'u1',
          company_id: 2,
          nombre: 'Carlos',
          dni: '12345678A',
          pin_acceso: '1234',
        },
      ],
      error: null,
    });
    mockFrom.mockReturnValueOnce(chain);

    const req = new NextRequest('http://localhost/api/mobile/conductor/login', {
      method: 'POST',
      body: JSON.stringify({ dni: '12345678-a', pin: '1234' }),
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.cookies.get(DRIVER_SESSION_COOKIE)?.value).toBeTruthy();

    const delRes = await DELETE();
    expect(delRes.status).toBe(200);
    expect(delRes.cookies.get(DRIVER_SESSION_COOKIE)?.value).toBe('');
  });

  it('returns 500 when supabase query fails', async () => {
    const chain = { select: jest.fn().mockReturnThis(), eq: jest.fn() };
    chain.eq
      .mockReturnValueOnce(chain)
      .mockResolvedValueOnce({ data: null, error: { message: 'DB fail' } });
    mockFrom.mockReturnValueOnce(chain);

    const req = new NextRequest('http://localhost/api/mobile/conductor/login', {
      method: 'POST',
      body: JSON.stringify({ dni: '12345678A', pin: '1234' }),
    });
    expect((await POST(req)).status).toBe(500);
  });
});
