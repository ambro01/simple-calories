/**
 * Rate Limiting Service
 *
 * Implements in-memory rate limiting using sliding window algorithm.
 * Prevents abuse by limiting the number of requests per time window.
 *
 * Current limits:
 * - AI Generations: 10 requests per minute per user
 *
 * NOTE: In-memory implementation - resets on server restart.
 * For production, consider Redis or database-backed rate limiting.
 *
 * @module RateLimitService
 */

/**
 * Rate limit configuration
 */
interface RateLimitConfig {
  /** Maximum number of requests allowed in the time window */
  maxRequests: number;

  /** Time window in milliseconds */
  windowMs: number;
}

/**
 * Timestamp record for a single request
 */
type RequestTimestamp = number;

/**
 * Rate limit check result
 */
export interface RateLimitResult {
  /** Whether the request is allowed */
  allowed: boolean;

  /** Current number of requests in the window */
  currentRequests: number;

  /** Maximum allowed requests */
  limit: number;

  /** Milliseconds until the oldest request expires (if rate limited) */
  retryAfter?: number;
}

/**
 * Rate Limiting Service
 *
 * Uses sliding window algorithm to track requests per user.
 * Each user's requests are stored in memory with timestamps.
 */
export class RateLimitService {
  /**
   * In-memory store: userId -> array of request timestamps
   */
  private requestStore: Map<string, RequestTimestamp[]> = new Map();

  /**
   * Rate limit configuration
   */
  private config: RateLimitConfig;

  /**
   * Cleanup interval ID for automatic memory cleanup
   */
  private cleanupInterval?: NodeJS.Timeout;

  constructor(config: RateLimitConfig) {
    this.config = config;

    // Start automatic cleanup every minute to prevent memory leaks
    this.startCleanup();
  }

  /**
   * Checks if a user has exceeded the rate limit
   *
   * @param userId - Unique user identifier (typically Supabase user ID)
   * @returns Rate limit check result with allowed status and metadata
   */
  checkRateLimit(userId: string): RateLimitResult {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    // Get user's request history
    const userRequests = this.requestStore.get(userId) || [];

    // Filter to only requests within the current window
    const recentRequests = userRequests.filter(
      (timestamp) => timestamp > windowStart
    );

    // Update store with filtered requests
    if (recentRequests.length > 0) {
      this.requestStore.set(userId, recentRequests);
    } else {
      this.requestStore.delete(userId);
    }

    // Check if limit is exceeded
    const allowed = recentRequests.length < this.config.maxRequests;

    // Calculate retry-after if rate limited
    let retryAfter: number | undefined;
    if (!allowed && recentRequests.length > 0) {
      const oldestRequest = Math.min(...recentRequests);
      retryAfter = oldestRequest + this.config.windowMs - now;
    }

    return {
      allowed,
      currentRequests: recentRequests.length,
      limit: this.config.maxRequests,
      retryAfter,
    };
  }

  /**
   * Records a new request for a user
   *
   * Should be called AFTER checking rate limit and confirming request is allowed.
   *
   * @param userId - Unique user identifier
   */
  incrementRateLimit(userId: string): void {
    const now = Date.now();
    const userRequests = this.requestStore.get(userId) || [];

    userRequests.push(now);
    this.requestStore.set(userId, userRequests);
  }

  /**
   * Manually reset rate limit for a specific user
   * Useful for testing or admin operations
   *
   * @param userId - User ID to reset
   */
  resetUserLimit(userId: string): void {
    this.requestStore.delete(userId);
  }

  /**
   * Get current request count for a user (for monitoring/debugging)
   *
   * @param userId - User ID to check
   * @returns Number of requests in current window
   */
  getCurrentCount(userId: string): number {
    const result = this.checkRateLimit(userId);
    return result.currentRequests;
  }

  /**
   * Starts automatic cleanup to prevent memory leaks
   * Removes expired request records every minute
   */
  private startCleanup(): void {
    // Run cleanup every minute
    this.cleanupInterval = setInterval(() => {
      this.cleanup();
    }, 60_000);
  }

  /**
   * Removes expired request records from memory
   */
  private cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.config.windowMs;

    for (const [userId, requests] of this.requestStore.entries()) {
      const recentRequests = requests.filter(
        (timestamp) => timestamp > windowStart
      );

      if (recentRequests.length === 0) {
        this.requestStore.delete(userId);
      } else {
        this.requestStore.set(userId, recentRequests);
      }
    }
  }

  /**
   * Stops the cleanup interval (for testing/shutdown)
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}

/**
 * Singleton instance for AI generation rate limiting
 * Limit: 10 requests per minute per user
 */
export const aiGenerationRateLimiter = new RateLimitService({
  maxRequests: 10,
  windowMs: 60_000, // 1 minute
});
