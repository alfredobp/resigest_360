import crypto from 'crypto';

function getRoleLinkSecret(): string {
  return (
    process.env.SIGNING_LINK_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    'resigest-360-role-link-hmac-v1'
  );
}

/**
 * Genera una firma HMAC-SHA256 acotada (32 hex) que vincula un token de firma pública con un rol concreto.
 */
export function signRoleLink(token: string, role: string): string {
  const payload = `${token.trim()}:${role.trim().toLowerCase()}`;
  return crypto
    .createHmac('sha256', getRoleLinkSecret())
    .update(payload)
    .digest('hex')
    .slice(0, 32);
}

/**
 * Verifica en tiempo constante que la firma HMAC corresponde al par (token, role).
 */
export function verifyRoleLink(token: string, role: string, sig: string): boolean {
  if (!token || !role || !sig || !/^[a-f0-9]{32}$/i.test(sig)) {
    return false;
  }
  const expected = signRoleLink(token, role);
  const a = Buffer.from(expected, 'utf8');
  const b = Buffer.from(sig.toLowerCase(), 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

