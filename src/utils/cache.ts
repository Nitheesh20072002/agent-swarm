
/**
 * Simple In-Memory Cache with TTL
 * Provides caching for frequently accessed data with automatic expiration
 */

import { logger } from './logger';

export interface CacheOptions {
  ttlSeconds?: number;
  maxSize?: number;
}

interface CacheEntry<T> {
  value: T;
  expiresAt: number;
  hits: number;
}

export class Cache<T> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly ttlMs: number;
  private readonly maxSize: number;

  constructor(options: CacheOptions = {}) {
    this.cache = new Map();
    this.ttlMs = (options.ttlSeconds || 300) * 1000; // Default 5 minutes
    this.maxSize = options.maxSize || 1000;
    
    // Start cleanup interval
    this.startCleanup();
  }

  /**
   * Get value from cache
   */
  get(key: string): T | null {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return null;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    // Increment hit counter
    entry.hits++;
    
    return entry.value;
  }

  /**
   * Set value in cache
   */
  set(key: string, value: T, ttlSeconds?: number): void {
    // Check size limit
    if (this.cache.size >= this.maxSize && !this.cache.has(key)) {
      this.evictOldest();
    }

    const ttl = ttlSeconds ? ttlSeconds * 1000 : this.ttlMs;
    
    this.cache.set(key, {
      value,
      expiresAt: Date.now() + ttl,
      hits: 0,
    });
  }

  /**
   * Delete value from cache
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Check if key exists in cache
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    
    if (!entry) {
      return false;
    }

    // Check if expired
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Clear all cached values
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get cache statistics
   */
  getStats(): {
    size: number;
    maxSize: number;
    hitRate: number;
    entries: Array<{ key: string; hits: number; ttl: number }>;
  } {
    const entries = Array.from(this.cache.entries()).map(([key, entry]) => ({
      key,
      hits: entry.hits,
      ttl: Math.max(0, Math.floor((entry.expiresAt - Date.now()) / 1000)),
    }));

    const totalHits = entries.reduce((sum, e) => sum + e.hits, 0);
    const hitRate = this.cache.size > 0 ? totalHits / this.cache.size : 0;

    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      hitRate,
      entries,
    };
  }

  /**
   * Evict oldest entry
   */
  private evictOldest(): void {
    let oldestKey: string | null = null;
    let oldestTime = Infinity;

    for (const [key, entry] of this.cache.entries()) {
      if (entry.expiresAt < oldestTime) {
        oldestTime = entry.expiresAt;
        oldestKey = key;
      }
    }

    if (oldestKey) {
      this.cache.delete(oldestKey);
      logger.debug('Cache evicted oldest entry', { key: oldestKey });
    }
  }

  /**
   * Start periodic cleanup of expired entries
   */
  private startCleanup(): void {
    setInterval(() => {
      const now = Date.now();
      let cleaned = 0;

      for (const [key, entry] of this.cache.entries()) {
        if (now > entry.expiresAt) {
          this.cache.delete(key);
          cleaned++;
        }
      }

      if (cleaned > 0) {
        logger.debug('Cache cleanup', { cleaned, remaining: this.cache.size });
      }
    }, 60000); // Cleanup every minute
  }

  /**
   * Get or compute value (with cache-aside pattern)
   */
  async getOrCompute(
    key: string,
    computeFn: () => Promise<T>,
    ttlSeconds?: number
  ): Promise<T> {
    // Check cache first
    const cached = this.get(key);
    if (cached !== null) {
      return cached;
    }

    // Compute value
    const value = await computeFn();
    
    // Store in cache
    this.set(key, value, ttlSeconds);
    
    return value;
  }
}

/**
 * Global cache instances for different data types
 */
export const contextCache = new Cache<any>({ ttlSeconds: 300, maxSize: 500 }); // 5 min TTL
export const agentCache = new Cache<any>({ ttlSeconds: 600, maxSize: 100 }); // 10 min TTL
export const userCache = new Cache<any>({ ttlSeconds: 600, maxSize: 100 }); // 10 min TTL
