/**
 * Rate-limiter simple en mémoire (fenêtre fixe).
 * Best-effort : par instance de process. Suffisant pour freiner spam/abus
 * sur les routes publiques (contact, devis, inscription, login).
 * Pour un rate-limit distribué multi-instances, migrer vers Upstash Redis.
 */

type Entry = { count: number; resetAt: number };

const store = new Map<string, Entry>();

// Purge paresseuse pour éviter une fuite mémoire si beaucoup d'IP différentes.
function purgeExpired(now: number) {
  if (store.size < 5000) return;
  for (const [k, v] of store) {
    if (v.resetAt <= now) store.delete(k);
  }
}

export type RateLimitResult = {
  ok: boolean;
  remaining: number;
  retryAfter: number; // secondes
};

/**
 * @param key     identifiant (ex. `contact:1.2.3.4`)
 * @param limit   nombre de requêtes autorisées par fenêtre
 * @param windowMs durée de la fenêtre en millisecondes
 */
export function rateLimit(key: string, limit: number, windowMs: number): RateLimitResult {
  const now = Date.now();
  purgeExpired(now);

  const entry = store.get(key);
  if (!entry || entry.resetAt <= now) {
    store.set(key, { count: 1, resetAt: now + windowMs });
    return { ok: true, remaining: limit - 1, retryAfter: 0 };
  }

  if (entry.count >= limit) {
    return { ok: false, remaining: 0, retryAfter: Math.ceil((entry.resetAt - now) / 1000) };
  }

  entry.count++;
  return { ok: true, remaining: limit - entry.count, retryAfter: 0 };
}

/** Récupère l'IP du client derrière un proxy (Vercel/Nginx). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return req.headers.get("x-real-ip") || "unknown";
}
