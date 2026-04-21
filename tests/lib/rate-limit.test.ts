import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { NextRequest } from "next/server";

// Mock NextResponse
vi.mock("next/server", () => ({
  NextResponse: {
    json: vi.fn((body, init) => ({
      body,
      status: init?.status || 200,
      headers: init?.headers || {},
    })),
  },
}));

// Import after mocking
const { checkRateLimit, RATE_LIMITS } = await import("@/lib/api/rate-limit");

function createMockRequest(
  headers: Record<string, string> = {}
): NextRequest {
  return {
    headers: {
      get: (key: string) => headers[key] || null,
    },
  } as unknown as NextRequest;
}

describe("Rate Limiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("checkRateLimit", () => {
    it("allows requests within the limit", () => {
      const req = createMockRequest();
      const config = { limit: 5, windowSeconds: 60, identifier: "test-1" };

      const result1 = checkRateLimit(req, "user-1", config);
      expect(result1.allowed).toBe(true);
      if (result1.allowed) {
        expect(result1.remaining).toBe(4);
      }

      const result2 = checkRateLimit(req, "user-1", config);
      expect(result2.allowed).toBe(true);
      if (result2.allowed) {
        expect(result2.remaining).toBe(3);
      }
    });

    it("blocks requests that exceed the limit", () => {
      const req = createMockRequest();
      const config = { limit: 3, windowSeconds: 60, identifier: "test-2" };

      // Make 3 requests (the limit)
      checkRateLimit(req, "user-2", config);
      checkRateLimit(req, "user-2", config);
      checkRateLimit(req, "user-2", config);

      // 4th request should be blocked
      const result = checkRateLimit(req, "user-2", config);
      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.retryAfter).toBeLessThanOrEqual(60);
      }
    });

    it("resets the counter after the window expires", () => {
      const req = createMockRequest();
      const config = { limit: 2, windowSeconds: 60, identifier: "test-3" };

      // Exhaust the limit
      checkRateLimit(req, "user-3", config);
      checkRateLimit(req, "user-3", config);

      const blockedResult = checkRateLimit(req, "user-3", config);
      expect(blockedResult.allowed).toBe(false);

      // Advance time past the window
      vi.advanceTimersByTime(61 * 1000);

      // Should be allowed again
      const allowedResult = checkRateLimit(req, "user-3", config);
      expect(allowedResult.allowed).toBe(true);
    });

    it("uses user ID when provided", () => {
      const req = createMockRequest();
      const config = { limit: 2, windowSeconds: 60, identifier: "test-4" };

      // Exhaust limit for user-4a
      checkRateLimit(req, "user-4a", config);
      checkRateLimit(req, "user-4a", config);

      const user4aResult = checkRateLimit(req, "user-4a", config);
      expect(user4aResult.allowed).toBe(false);

      // Different user should have their own limit
      const user4bResult = checkRateLimit(req, "user-4b", config);
      expect(user4bResult.allowed).toBe(true);
    });

    it("falls back to IP when user ID is null", () => {
      const req = createMockRequest({ "x-forwarded-for": "192.168.1.1" });
      const config = { limit: 2, windowSeconds: 60, identifier: "test-5" };

      // Exhaust limit for this IP
      checkRateLimit(req, null, config);
      checkRateLimit(req, null, config);

      const result = checkRateLimit(req, null, config);
      expect(result.allowed).toBe(false);

      // Different IP should work
      const req2 = createMockRequest({ "x-forwarded-for": "192.168.1.2" });
      const result2 = checkRateLimit(req2, null, config);
      expect(result2.allowed).toBe(true);
    });

    it("handles x-forwarded-for with multiple IPs", () => {
      const req = createMockRequest({
        "x-forwarded-for": "192.168.1.1, 10.0.0.1, proxy.example.com",
      });
      const config = { limit: 2, windowSeconds: 60, identifier: "test-6" };

      checkRateLimit(req, null, config);
      checkRateLimit(req, null, config);

      const result = checkRateLimit(req, null, config);
      expect(result.allowed).toBe(false);
    });

    it("uses x-real-ip as fallback", () => {
      const req = createMockRequest({ "x-real-ip": "10.10.10.10" });
      const config = { limit: 2, windowSeconds: 60, identifier: "test-7" };

      checkRateLimit(req, null, config);
      checkRateLimit(req, null, config);

      const result = checkRateLimit(req, null, config);
      expect(result.allowed).toBe(false);
    });

    it("uses anonymous for requests without identification", () => {
      const req = createMockRequest();
      const config = { limit: 2, windowSeconds: 60, identifier: "test-8" };

      checkRateLimit(req, null, config);
      checkRateLimit(req, null, config);

      const result = checkRateLimit(req, null, config);
      expect(result.allowed).toBe(false);
    });

    it("separates limits by identifier", () => {
      const req = createMockRequest();
      const config1 = { limit: 2, windowSeconds: 60, identifier: "endpoint-a" };
      const config2 = { limit: 2, windowSeconds: 60, identifier: "endpoint-b" };

      // Exhaust limit for endpoint-a
      checkRateLimit(req, "user-9", config1);
      checkRateLimit(req, "user-9", config1);

      const resultA = checkRateLimit(req, "user-9", config1);
      expect(resultA.allowed).toBe(false);

      // endpoint-b should still work
      const resultB = checkRateLimit(req, "user-9", config2);
      expect(resultB.allowed).toBe(true);
    });

    it("returns correct response format when blocked", () => {
      const req = createMockRequest();
      const config = { limit: 1, windowSeconds: 30, identifier: "test-10" };

      checkRateLimit(req, "user-10", config);
      const result = checkRateLimit(req, "user-10", config);

      expect(result.allowed).toBe(false);
      if (!result.allowed) {
        expect(result.response).toBeDefined();
        expect(result.response.status).toBe(429);
        expect(result.retryAfter).toBeGreaterThan(0);
        expect(result.retryAfter).toBeLessThanOrEqual(30);
      }
    });
  });

  describe("RATE_LIMITS presets", () => {
    it("has correct configuration for AI scoring", () => {
      expect(RATE_LIMITS.aiScoring).toEqual({
        limit: 20,
        windowSeconds: 60,
        identifier: "ai-scoring",
      });
    });

    it("has correct configuration for AI generation", () => {
      expect(RATE_LIMITS.aiGeneration).toEqual({
        limit: 10,
        windowSeconds: 60,
        identifier: "ai-generation",
      });
    });

    it("has correct configuration for JIRA sync", () => {
      expect(RATE_LIMITS.jiraSync).toEqual({
        limit: 5,
        windowSeconds: 300,
        identifier: "jira-sync",
      });
    });

    it("has correct configuration for standard API", () => {
      expect(RATE_LIMITS.standard).toEqual({
        limit: 100,
        windowSeconds: 60,
        identifier: "standard",
      });
    });

    it("has correct configuration for auth endpoints", () => {
      expect(RATE_LIMITS.auth).toEqual({
        limit: 10,
        windowSeconds: 300,
        identifier: "auth",
      });
    });
  });
});
