/**
 * Rate limit en memoria por clave (IP). Ventana deslizante simple.
 * Limitación conocida: en entornos serverless cada instancia tiene su propio contador,
 * por lo que es una defensa best-effort contra abuso básico, no un límite global.
 */
const hits = new Map<string, number[]>()

export function rateLimit(key: string, limit = 5, windowMs = 60_000, now = Date.now()): boolean {
  const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs)
  if (recent.length >= limit) {
    hits.set(key, recent)
    return false
  }
  recent.push(now)
  hits.set(key, recent)
  if (hits.size > 5000) {
    for (const [k, v] of hits) {
      if (v.every((t) => now - t >= windowMs)) hits.delete(k)
    }
  }
  return true
}

export function clientIp(headers: Headers): string {
  return headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown'
}

export function resetRateLimit() {
  hits.clear()
}
