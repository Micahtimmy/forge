import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Simple in-memory rate limiter.
 * For production at scale, use Redis or Upstash.
 * This implementation works for single-instance deployments and edge functions.
 */

type RateLimitEntry = {
  count: number;
  resetAt: number;
};

// Use a Map for in-memory storage (works in edge runtime)
const rateLimitStore = new Map<string, RateLimitEntry>();

// Cleanup old entries periodically to prevent memory leaks
const CLEANUP_INTERVAL = 60_000; // 1 minute
let lastCleanup = Date.now();

function cleanup() {
  const now = Date.now();
  if (now - lastCleanup < CLEANUP_INTERVAL) return;

  lastCleanup = now;
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key);
    }
  }
}

export type RateLimitConfig = {
  /** Maximum requests allowed in the window */
  limit: number;
  /** Window size in seconds */
  windowSeconds: number;
  /** Unique identifier for this rate limit (e.g., "ai-scoring", "jira-sync") */
  identifier: string;
};

export type RateLimitResult =
  | { allowed: true; remaining: number; resetAt: number }
  | { allowed: false; response: NextResponse; retryAfter: number };

/**
 * Check if request is from a trusted proxy (Vercel).
 * Only trust forwarded headers from known infrastructure.
 */
function isTrustedProxy(req: NextRequest): boolean {
  // Vercel adds this header to requests
  const vercelId = req.headers.get("x-vercel-id");
  // Also check for Vercel's proxy signature
  const vercelProxy = req.headers.get("x-vercel-proxy-signature");

  return vercelId !== null || vercelProxy !== null;
}

/**
 * Get client IP address safely, only trusting forwarded headers from known proxies.
 */
function getClientIp(req: NextRequest): string {
  // Only trust x-forwarded-for from Vercel's proxy
  if (isTrustedProxy(req)) {
    const forwardedFor = req.headers.get("x-forwarded-for");
    if (forwardedFor) {
      // Take the first IP (original client)
      const clientIp = forwardedFor.split(",")[0]?.trim();
      if (clientIp) return clientIp;
    }

    const realIp = req.headers.get("x-real-ip");
    if (realIp) return realIp;
  }

  // Fallback - cannot determine IP reliably
  return "unknown";
}

/**
 * Rate limits a request based on user ID or IP address.
 *
 * Usage:
 * ```ts
 * const rateLimit = checkRateLimit(req, userId, {
 *   limit: 10,
 *   windowSeconds: 60,
 *   identifier: "ai-scoring"
 * });
 *
 * if (!rateLimit.allowed) {
 *   return rateLimit.response;
 * }
 * ```
 */
export function checkRateLimit(
  req: NextRequest,
  userId: string | null,
  config: RateLimitConfig
): RateLimitResult {
  cleanup();

  // Use user ID if available (most reliable), otherwise fall back to IP
  // This prevents IP spoofing attacks since authenticated users are tracked by ID
  const clientIdentifier = userId || getClientIp(req);

  const key = `${config.identifier}:${clientIdentifier}`;
  const now = Date.now();
  const windowMs = config.windowSeconds * 1000;

  const entry = rateLimitStore.get(key);

  if (!entry || entry.resetAt < now) {
    // New window
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + windowMs,
    });
    return {
      allowed: true,
      remaining: config.limit - 1,
      resetAt: now + windowMs,
    };
  }

  if (entry.count >= config.limit) {
    // Rate limited
    const retryAfter = Math.ceil((entry.resetAt - now) / 1000);
    return {
      allowed: false,
      retryAfter,
      response: NextResponse.json(
        {
          success: false,
          error: "Rate limit exceeded",
          retryAfter,
        },
        {
          status: 429,
          headers: {
            "Retry-After": String(retryAfter),
            "X-RateLimit-Limit": String(config.limit),
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(Math.ceil(entry.resetAt / 1000)),
          },
        }
      ),
    };
  }

  // Increment counter
  entry.count += 1;
  rateLimitStore.set(key, entry);

  return {
    allowed: true,
    remaining: config.limit - entry.count,
    resetAt: entry.resetAt,
  };
}

// Pre-configured rate limits for different endpoints
export const RATE_LIMITS = {
  // AI endpoints - expensive operations
  aiScoring: {
    limit: 20,
    windowSeconds: 60,
    identifier: "ai-scoring",
  },
  aiGeneration: {
    limit: 10,
    windowSeconds: 60,
    identifier: "ai-generation",
  },

  // JIRA operations
  jiraSync: {
    limit: 5,
    windowSeconds: 300, // 5 minutes
    identifier: "jira-sync",
  },
  jira: {
    limit: 60,
    windowSeconds: 60,
    identifier: "jira",
  },

  // Email sending - prevent abuse
  emailSend: {
    limit: 20,
    windowSeconds: 60,
    identifier: "email-send",
  },

  // General API
  standard: {
    limit: 100,
    windowSeconds: 60,
    identifier: "standard",
  },

  // Auth endpoints - stricter to prevent brute force
  auth: {
    limit: 10,
    windowSeconds: 300, // 5 minutes
    identifier: "auth",
  },
} as const satisfies Record<string, RateLimitConfig>;
