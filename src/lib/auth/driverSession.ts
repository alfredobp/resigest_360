import crypto from 'crypto';

export const DRIVER_SESSION_COOKIE = 'resigest_driver_session';
const DEFAULT_TTL_SECONDS = 60 * 60 * 24 * 30; // 30 días

export interface DriverSessionPayload {
  driverId: number;
  companyId: number | null;
  userId: string;
  dni: string;
  nombre: string;
  exp: number;
}

function getSessionSecret(): string {
  return (
    process.env.DRIVER_SESSION_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    'resigest-driver-dev-secret'
  );
}

/**
 * Crea un token de sesión firmado con HMAC-SHA256 para el portal PWA del conductor.
 */
export function signDriverSessionToken(
  payload: Omit<DriverSessionPayload, 'exp'>,
  ttlSeconds = DEFAULT_TTL_SECONDS
): string {
  const fullPayload: DriverSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const encoded = Buffer.from(JSON.stringify(fullPayload), 'utf8').toString('base64url');
  const signature = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');
  return `${encoded}.${signature}`;
}

/**
 * Verifica y decodifica un token de sesión de conductor. Devuelve null si es inválido o caducado.
 */
export function verifyDriverSessionToken(token?: string | null): DriverSessionPayload | null {
  if (!token || !token.includes('.')) return null;

  const [encoded, providedSig] = token.split('.');
  if (!encoded || !providedSig) return null;

  const expectedSig = crypto
    .createHmac('sha256', getSessionSecret())
    .update(encoded)
    .digest('base64url');

  const sigBuffer = Buffer.from(providedSig, 'utf8');
  const expectedBuffer = Buffer.from(expectedSig, 'utf8');
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  try {
    const parsed = JSON.parse(
      Buffer.from(encoded, 'base64url').toString('utf8')
    ) as DriverSessionPayload;

    if (!parsed.driverId || !parsed.userId || !parsed.dni || !parsed.exp) {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

