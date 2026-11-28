import { NextRequest } from 'next/server';

const mockGetUser = jest.fn();
const mockServerFrom = jest.fn();
const mockSendDecaAssigned = jest.fn();
const mockCheckPremium = jest.fn();

jest.mock('@/lib/auth/premiumGate', () => ({
  checkCompanyPremiumFeature: (...args: unknown[]) => mockCheckPremium(...args),
}));

jest.mock('@/lib/supabase/server', () => ({
  createClient: async () => ({
    auth: { getUser: mockGetUser },
    from: mockServerFrom,
  }),
}));

jest.mock('@/services/pushNotificationService', () => ({
  __esModule: true,
  default: {
    sendDecaAssignedNotification: (...args: unknown[]) => mockSendDecaAssigned(...args),
  },
}));

import { POST } from '../route';

describe('POST /api/push/notify-deca', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'u1' } } });
    mockSendDecaAssigned.mockResolvedValue({ sent: 1, failed: 0 });
    mockCheckPremium.mockResolvedValue({ active: true, status: 'premium' });
  });

  it('returns 401 when unauthenticated and 400 when decaId missing', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const req1 = new NextRequest('http://localhost/api/push/notify-deca', {
      method: 'POST',
      body: JSON.stringify({ decaId: 1 }),
    });
    expect((await POST(req1)).status).toBe(401);

    const req2 = new NextRequest('http://localhost/api/push/notify-deca', {
      method: 'POST',
      body: JSON.stringify({}),
    });
    expect((await POST(req2)).status).toBe(400);
  });

  it('respects disabled config unless forced, and sends notification when enabled', async () => {
    mockServerFrom.mockImplementation((table: string) => {
      if (table === 'deca_documents') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 10,
              user_id: 'u1',
              company_id: 2,
              numero_deca: 'DECA-10',
              token: 'dca_10',
              conductor_dni: '12345678A',
            },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({
          data: { app_config: { deca: { notificar_push_conductor: false } } },
        }),
      };
    });

    const reqSkipped = new NextRequest('http://localhost/api/push/notify-deca', {
      method: 'POST',
      body: JSON.stringify({ decaId: 10 }),
    });
    const resSkipped = await POST(reqSkipped);
    expect(resSkipped.status).toBe(200);
    expect((await resSkipped.json()).skippedReason).toBe('DISABLED_IN_CONFIG');

    const reqForced = new NextRequest('http://localhost/api/push/notify-deca', {
      method: 'POST',
      body: JSON.stringify({ decaId: 10, force: true }),
    });
    const resForced = await POST(reqForced);
    expect(resForced.status).toBe(200);
    expect(mockSendDecaAssigned).toHaveBeenCalledTimes(1);
  });

  it('returns 404 when deca not found and sends when enabled without company_id', async () => {
    mockServerFrom.mockReturnValueOnce({
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockReturnThis(),
      maybeSingle: jest.fn().mockResolvedValue({ data: null, error: null }),
    });

    const res404 = await POST(
      new NextRequest('http://localhost/api/push/notify-deca', {
        method: 'POST',
        body: JSON.stringify({ decaId: 999 }),
      })
    );
    expect(res404.status).toBe(404);

    mockServerFrom.mockImplementation((table: string) => {
      if (table === 'deca_documents') {
        return {
          select: jest.fn().mockReturnThis(),
          eq: jest.fn().mockReturnThis(),
          maybeSingle: jest.fn().mockResolvedValue({
            data: {
              id: 11,
              user_id: 'u1',
              company_id: null,
              numero_deca: 'DECA-11',
              token: 'dca_11',
              conductor_dni: '12345678A',
            },
            error: null,
          }),
        };
      }
      return {
        select: jest.fn().mockReturnThis(),
        eq: jest.fn().mockReturnThis(),
        maybeSingle: jest.fn().mockResolvedValue({ data: null }),
      };
    });

    const resOk = await POST(
      new NextRequest('http://localhost/api/push/notify-deca', {
        method: 'POST',
        body: JSON.stringify({ decaId: 11 }),
      })
    );
    expect(resOk.status).toBe(200);
    expect(mockSendDecaAssigned).toHaveBeenCalledTimes(1);
  });
});
