interface RateLimitEntry {
  count: number;
  firstRequest: number;
  blocked: boolean;
  blockedUntil?: number;
}

const store = new Map<string, RateLimitEntry>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, entry] of store.entries()) {
    if (now - entry.firstRequest > 15 * 60 * 1000) {
      store.delete(key);
    }
  }
}, 5 * 60 * 1000);

export interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  blockDurationMs?: number;
}

export function rateLimit(
  identifier: string,
  config: RateLimitConfig = { maxRequests: 5, windowMs: 15 * 60 * 1000, blockDurationMs: 15 * 60 * 1000 }
): { success: boolean; remaining: number; resetTime: number; retryAfter?: number } {
  const now = Date.now();
  const entry = store.get(identifier);

  if (entry?.blocked) {
    const blockedUntil = entry.blockedUntil ?? 0;
    if (now < blockedUntil) {
      return {
        success: false,
        remaining: 0,
        resetTime: blockedUntil,
        retryAfter: Math.ceil((blockedUntil - now) / 1000),
      };
    }
    // Block expired, reset
    store.delete(identifier);
  }

  if (!entry || now - entry.firstRequest > config.windowMs) {
    store.set(identifier, { count: 1, firstRequest: now, blocked: false });
    return {
      success: true,
      remaining: config.maxRequests - 1,
      resetTime: now + config.windowMs,
    };
  }

  entry.count += 1;

  if (entry.count > config.maxRequests) {
    const blockedUntil = now + (config.blockDurationMs ?? config.windowMs);
    entry.blocked = true;
    entry.blockedUntil = blockedUntil;
    return {
      success: false,
      remaining: 0,
      resetTime: blockedUntil,
      retryAfter: Math.ceil((config.blockDurationMs ?? config.windowMs) / 1000),
    };
  }

  return {
    success: true,
    remaining: config.maxRequests - entry.count,
    resetTime: entry.firstRequest + config.windowMs,
  };
}

export function getClientIP(request: Request): string {
  const forwarded = request.headers.get("x-forwarded-for");
  const realIP = request.headers.get("x-real-ip");
  if (forwarded) return forwarded.split(",")[0].trim();
  if (realIP) return realIP;
  return "unknown";
}
