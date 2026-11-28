import {
  signDriverSessionToken,
  verifyDriverSessionToken,
} from '@/lib/auth/driverSession';

describe('driverSession', () => {
  beforeEach(() => {
    process.env.DRIVER_SESSION_SECRET = 'test-driver-secret-key';
  });

  it('signs and verifies a valid driver session token', () => {
    const token = signDriverSessionToken({
      driverId: 12,
      companyId: 5,
      userId: 'user-1',
      dni: '12345678A',
      nombre: 'Carlos Ruiz',
    });

    const decoded = verifyDriverSessionToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.driverId).toBe(12);
    expect(decoded?.dni).toBe('12345678A');
  });

  it('returns null for missing, malformed, tampered, or expired tokens', () => {
    expect(verifyDriverSessionToken(null)).toBeNull();
    expect(verifyDriverSessionToken('invalid-no-dot')).toBeNull();

    const token = signDriverSessionToken({
      driverId: 1,
      companyId: null,
      userId: 'u1',
      dni: '11111111A',
      nombre: 'Ana',
    });
    const [body, sig] = token.split('.');
    expect(verifyDriverSessionToken(`${body}.tampered${sig.slice(8)}`)).toBeNull();

    const expiredToken = signDriverSessionToken(
      {
        driverId: 1,
        companyId: null,
        userId: 'u1',
        dni: '11111111A',
        nombre: 'Ana',
      },
      -10
    );
    expect(verifyDriverSessionToken(expiredToken)).toBeNull();
  });
});

