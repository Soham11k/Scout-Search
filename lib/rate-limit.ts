/**
 * Simple sliding-window rate limiter using an in-memory Map.
 * Works across a single Node.js process (dev + single Vercel instance).
 * For multi-instance production, swap the store for Redis/Upstash.
 */

type WindowEntry = {
  count: number
  resetAt: number
}

const store = new Map<string, WindowEntry>()

// Clean up old entries every 5 minutes to prevent unbounded memory growth
setInterval(
  () => {
    const now = Date.now()
    for (const [key, entry] of store.entries()) {
      if (entry.resetAt < now) store.delete(key)
    }
  },
  5 * 60 * 1000,
)

export type RateLimitResult =
  | { limited: false; remaining: number }
  | { limited: true; retryAfterSecs: number }

/**
 * @param key       Unique identifier — e.g. IP address or user id
 * @param limit     Max requests allowed in the window
 * @param windowMs  Window duration in milliseconds
 */
export function rateLimit(
  key: string,
  limit: number,
  windowMs: number,
): RateLimitResult {
  const now = Date.now()
  const existing = store.get(key)

  if (!existing || existing.resetAt < now) {
    store.set(key, { count: 1, resetAt: now + windowMs })
    return { limited: false, remaining: limit - 1 }
  }

  existing.count += 1

  if (existing.count > limit) {
    return {
      limited: true,
      retryAfterSecs: Math.ceil((existing.resetAt - now) / 1000),
    }
  }

  return { limited: false, remaining: limit - existing.count }
}

/** Extract the best available IP from a Next.js Request */
export function getIP(request: Request): string {
  return (
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    request.headers.get('x-real-ip') ||
    'unknown'
  )
}
