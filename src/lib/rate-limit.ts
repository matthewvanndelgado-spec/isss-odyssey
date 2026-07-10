/**
 * Simple in-memory rate limiter using a sliding window approach.
 * Suitable for single-instance MVP deployments. For production,
 * replace with Redis-backed solution (e.g., @upstash/ratelimit).
 */

interface RateLimitEntry {
  tokens: number;
  lastRefill: number;
}

interface RateLimiterOptions {
  /** Maximum number of requests allowed in the window */
  maxTokens: number;
  /** Time window in milliseconds for token refill */
  windowMs: number;
}

class RateLimiter {
  private store: Map<string, RateLimitEntry> = new Map();
  private readonly maxTokens: number;
  private readonly windowMs: number;
  private cleanupInterval: ReturnType<typeof setInterval> | null = null;

  constructor(options: RateLimiterOptions) {
    this.maxTokens = options.maxTokens;
    this.windowMs = options.windowMs;

    // Periodic cleanup of expired entries to prevent memory leaks
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, Math.max(this.windowMs * 2, 60_000));

    // Allow garbage collection of the interval
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  /**
   * Check if a request is allowed for the given key.
   * Returns { allowed: true } if under limit, or { allowed: false, retryAfterMs } if over limit.
   */
  check(key: string): { allowed: boolean; retryAfterMs?: number } {
    const now = Date.now();
    const entry = this.store.get(key);

    if (!entry) {
      // First request from this key
      this.store.set(key, { tokens: this.maxTokens - 1, lastRefill: now });
      return { allowed: true };
    }

    // Calculate tokens to refill based on elapsed time
    const elapsed = now - entry.lastRefill;
    const refillRate = this.maxTokens / this.windowMs;
    const tokensToAdd = elapsed * refillRate;
    const newTokens = Math.min(this.maxTokens, entry.tokens + tokensToAdd);

    if (newTokens < 1) {
      // Rate limited
      const waitTime = Math.ceil((1 - newTokens) / refillRate);
      return { allowed: false, retryAfterMs: waitTime };
    }

    // Consume one token
    entry.tokens = newTokens - 1;
    entry.lastRefill = now;
    return { allowed: true };
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];
    this.store.forEach((entry, key) => {
      // If enough time has passed for a full refill, remove the entry
      if (now - entry.lastRefill > this.windowMs * 2) {
        keysToDelete.push(key);
      }
    });
    keysToDelete.forEach((key) => this.store.delete(key));
  }
}

// Pre-configured rate limiters for different use cases

/** Auth endpoints: 5 requests per 60 seconds per key */
export const authRateLimiter = new RateLimiter({
  maxTokens: 5,
  windowMs: 60_000,
});

/** AI chat: 10 requests per 60 seconds per key */
export const chatRateLimiter = new RateLimiter({
  maxTokens: 10,
  windowMs: 60_000,
});

export { RateLimiter, type RateLimiterOptions };
