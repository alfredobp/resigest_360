const mockSendNotification = jest.fn();
const mockSetVapidDetails = jest.fn();

jest.mock('web-push', () => ({
  __esModule: true,
  default: {
    setVapidDetails: (...args: unknown[]) => mockSetVapidDetails(...args),
    sendNotification: (...args: unknown[]) => mockSendNotification(...args),
  },
}));

const mockFrom = jest.fn();
jest.mock('@supabase/supabase-js', () => ({
  createClient: () => ({
    from: mockFrom,
  }),
}));

import pushNotificationService from '@/services/pushNotificationService';

describe('pushNotificationService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://example.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'anon-key';
    process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY = 'vapid-pub';
    process.env.VAPID_PRIVATE_KEY = 'vapid-priv';
  });

  it('skips when VAPID keys or DNI are missing', async () => {
    delete process.env.VAPID_PRIVATE_KEY;
    const res1 = await pushNotificationService.sendDecaAssignedNotification({
      userId: 'u1',
      conductorDni: '12345678A',
      numeroDeca: 'DECA-1',
      token: 'dca_1',
    });
    expect(res1.skippedReason).toBe('VAPID_NOT_CONFIGURED');

    process.env.VAPID_PRIVATE_KEY = 'vapid-priv';
    const res2 = await pushNotificationService.sendDecaAssignedNotification({
      userId: 'u1',
      conductorDni: '',
      numeroDeca: 'DECA-1',
      token: 'dca_1',
    });
    expect(res2.skippedReason).toBe('NO_DRIVER_DNI');
  });

  it('skips when driver or subscriptions are not found', async () => {
    const drvChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn(),
    };
    drvChain.eq.mockReturnValueOnce(drvChain).mockResolvedValueOnce({ data: [] });
    mockFrom.mockReturnValueOnce(drvChain);

    const resNoDriver = await pushNotificationService.sendDecaAssignedNotification({
      userId: 'u1',
      conductorDni: '12345678A',
      numeroDeca: 'DECA-1',
      token: 'dca_1',
    });
    expect(resNoDriver.skippedReason).toBe('DRIVER_NOT_FOUND');
  });

  it('sends notifications and cleans up 410 expired subscriptions', async () => {
    const drvChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn(),
    };
    drvChain.eq
      .mockReturnValueOnce(drvChain)
      .mockResolvedValueOnce({ data: [{ id: 7, dni: '12345678A' }] });

    const subsChain = {
      select: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({
        data: [
          { id: 100, endpoint: 'https://push/ok', p256dh: 'p1', auth: 'a1' },
          { id: 101, endpoint: 'https://push/gone', p256dh: 'p2', auth: 'a2' },
        ],
      }),
    };

    const deleteChain = {
      delete: jest.fn().mockReturnThis(),
      eq: jest.fn().mockResolvedValue({ error: null }),
    };

    mockFrom
      .mockReturnValueOnce(drvChain)
      .mockReturnValueOnce(subsChain)
      .mockReturnValueOnce(deleteChain);

    mockSendNotification
      .mockResolvedValueOnce({})
      .mockRejectedValueOnce({ statusCode: 410 });

    const res = await pushNotificationService.sendDecaAssignedNotification({
      userId: 'u1',
      conductorDni: '12345678-a',
      numeroDeca: 'DECA-2026-00001',
      token: 'dca_abc',
      origenMunicipio: 'Sevilla',
      destinoMunicipio: 'Córdoba',
      matricula: '1234ABC',
    });

    expect(res).toEqual({ sent: 1, failed: 1 });
    expect(deleteChain.eq).toHaveBeenCalledWith('id', 101);
  });
});

