import { NextResponse } from "next/server";

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();

// Periodically clean up expired entries every 5 minutes
if (typeof setInterval !== "undefined") {
  setInterval(() => {
    const now = Date.now();
    for (const [key, record] of rateLimitStore.entries()) {
      if (record.resetAt <= now) {
        rateLimitStore.delete(key);
      }
    }
  }, 5 * 60 * 1000);
}

export function getClientIp(req: Request): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0].trim();
  }
  const realIp = req.headers.get("x-real-ip");
  if (realIp) return realIp.trim();
  const cfIp = req.headers.get("cf-connecting-ip");
  if (cfIp) return cfIp.trim();
  return "127.0.0.1";
}

/**
 * Rate limit a request.
 * @param keyIdentifier e.g. `login:${ip}` or `vote:${ip}:${projectId}`
 * @param maxRequests maximum allowed in window
 * @param windowMs time window in milliseconds (default: 60s)
 */
export function checkRateLimit(
  keyIdentifier: string,
  maxRequests: number = 60,
  windowMs: number = 60 * 1000
): { allowed: boolean; remaining: number; resetInSec: number } {
  const now = Date.now();
  const existing = rateLimitStore.get(keyIdentifier);

  if (!existing || existing.resetAt <= now) {
    rateLimitStore.set(keyIdentifier, { count: 1, resetAt: now + windowMs });
    return {
      allowed: true,
      remaining: maxRequests - 1,
      resetInSec: Math.ceil(windowMs / 1000),
    };
  }

  if (existing.count >= maxRequests) {
    const resetInSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
    return {
      allowed: false,
      remaining: 0,
      resetInSec,
    };
  }

  existing.count += 1;
  const resetInSec = Math.max(1, Math.ceil((existing.resetAt - now) / 1000));
  return {
    allowed: true,
    remaining: maxRequests - existing.count,
    resetInSec,
  };
}

export function rateLimitResponse(resetInSec: number, customMessage?: string) {
  return NextResponse.json(
    {
      error:
        customMessage ||
        `Too many requests. Please wait ${resetInSec} seconds before trying again.`,
      retryAfter: resetInSec,
    },
    {
      status: 429,
      headers: {
        "Retry-After": String(resetInSec),
      },
    }
  );
}
