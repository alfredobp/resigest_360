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
import {
  DRIVER_SESSION_COOKIE,
  signDriverSessionToken,
} from '@/lib/auth/driverSession';

describe('/api/push/subscribe', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    mockCheckPremium.mockResolvedValue({ active: true, status: 'premium' });
  });

  it('returns 401 without valid driver session', async () => {
    const req = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect((await POST(req)).status).toBe(401);
    expect((await DELETE(req)).status).toBe(401);
  });

  it('validates subscription payload and saves/deletes subscription', async () => {
    const token = signDriverSessionToken({
      driverId: 5,
      companyId: 10,
      userId: 'u1',
      dni: '12345678A',
      nombre: 'Carlos',
    });

    const badReq = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      headers: { cookie: `${DRIVER_SESSION_COOKIE}=${token}` },
      body: JSON.stringify({ endpoint: 'https://push/1' }),
    });
    expect((await POST(badReq)).status).toBe(400);

    mockFrom.mockReturnValueOnce({
      upsert: jest.fn().mockResolvedValue({ error: null }),
    });

    const okReq = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'POST',
      headers: { cookie: `${DRIVER_SESSION_COOKIE}=${token}` },
      body: JSON.stringify({
        endpoint: 'https://push/1',
        keys: { p256dh: 'p', auth: 'a' },
      }),
    });
    expect((await POST(okReq)).status).toBe(200);

    const delChain = { delete: jest.fn().mockReturnThis(), eq: jest.fn() };
    delChain.eq.mockReturnValueOnce(delChain).mockResolvedValueOnce({ error: null });
    mockFrom.mockReturnValueOnce(delChain);

    const delReq = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'DELETE',
      headers: { cookie: `${DRIVER_SESSION_COOKIE}=${token}` },
      body: JSON.stringify({ endpoint: 'https://push/1' }),
    });
    expect((await DELETE(delReq)).status).toBe(200);

    // Test POST and DELETE DB errors and DELETE without body
    mockFrom.mockReturnValueOnce({
      upsert: jest.fn().mockResolvedValue({ error: { message: 'Upsert fail' } }),
    });
    expect((await POST(okReq)).status).toBe(500);

    const delErrChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: { message: 'Delete fail' } }),
    };
    mockFrom.mockReturnValueOnce(delErrChain);
    const delEmptyReq = new NextRequest('http://localhost/api/push/subscribe', {
      method: 'DELETE',
      headers: { cookie: `${DRIVER_SESSION_COOKIE}=${token}` },
    });
    expect((await DELETE(delEmptyReq)).status).toBe(500);

    // Test missing Supabase env vars -> 500 on POST and DELETE
    delete process.env.NEXT_PUBLIC_SUPABASE_URL;
    expect((await POST(okReq)).status).toBe(500);
    expect((await DELETE(delEmptyReq)).status).toBe(500);

    // Test 403 when Premium is not active
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    mockCheckPremium.mockResolvedValueOnce({ active: false, status: 'basic' });
    expect((await POST(okReq)).status).toBe(403);
  });
});
