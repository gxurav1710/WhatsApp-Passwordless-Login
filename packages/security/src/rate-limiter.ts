interface RateLimitRecord {
  timestamps: number[];
}

/**
 * Sliding Window In-Memory Rate Limiter
 */
export class SlidingWindowRateLimiter {
  private records = new Map<string, RateLimitRecord>();
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor(
    private readonly windowMs: number = 60000,
    private readonly maxRequests: number = 10
  ) {
    // Periodic garbage collection every 2 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 120000);
    if (this.cleanupInterval.unref) {
      this.cleanupInterval.unref();
    }
  }

  public check(key: string, limit?: number): { allowed: boolean; remaining: number; resetMs: number } {
    const max = limit ?? this.maxRequests;
    const now = Date.now();
    const windowStart = now - this.windowMs;

    let record = this.records.get(key);
    if (!record) {
      record = { timestamps: [] };
      this.records.set(key, record);
    }

    // Filter out timestamps outside the sliding window
    record.timestamps = record.timestamps.filter((ts) => ts > windowStart);

    if (record.timestamps.length >= max) {
      const oldest = record.timestamps[0];
      const resetMs = Math.max(0, oldest + this.windowMs - now);
      return { allowed: false, remaining: 0, resetMs };
    }

    record.timestamps.push(now);
    const remaining = max - record.timestamps.length;
    return { allowed: true, remaining, resetMs: this.windowMs };
  }

  public reset(key: string): void {
    this.records.delete(key);
  }

  public cleanup(): void {
    const now = Date.now();
    const windowStart = now - this.windowMs;
    for (const [key, record] of this.records.entries()) {
      record.timestamps = record.timestamps.filter((ts) => ts > windowStart);
      if (record.timestamps.length === 0) {
        this.records.delete(key);
      }
    }
  }

  public destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }
    this.records.clear();
  }
}
