
/**
 * Retry Utility
 * Implements exponential backoff retry logic with customizable options
 */

import { logger } from './logger';

export interface RetryOptions {
  maxAttempts?: number;
  initialDelayMs?: number;
  maxDelayMs?: number;
  backoffMultiplier?: number;
  retryableErrors?: string[];
}

export interface RetryResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
  attempts: number;
}

const DEFAULT_OPTIONS: Required<RetryOptions> = {
  maxAttempts: 3,
  initialDelayMs: 1000,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  retryableErrors: [
    'ECONNREFUSED',
    'ETIMEDOUT',
    'ENOTFOUND',
    'rate limit',
    'timeout',
    '429',
    '500',
    '502',
    '503',
    '504',
  ],
};

/**
 * Retry an async operation with exponential backoff
 */
export async function retryWithBackoff<T>(
  operation: () => Promise<T>,
  options: RetryOptions = {},
  context?: string
): Promise<T> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  let lastError: Error | null = null;
  let attempt = 0;

  while (attempt < opts.maxAttempts) {
    attempt++;

    try {
      const result = await operation();
      
      if (attempt > 1) {
        logger.info('Operation succeeded after retry', {
          context,
          attempt,
          totalAttempts: opts.maxAttempts,
        });
      }
      
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Check if error is retryable
      const isRetryable = opts.retryableErrors.some(retryableError =>
        error.message?.toLowerCase().includes(retryableError.toLowerCase()) ||
        error.code?.toLowerCase().includes(retryableError.toLowerCase())
      );

      if (!isRetryable || attempt >= opts.maxAttempts) {
        logger.error('Operation failed - not retrying', {
          context,
          attempt,
          error: error.message,
          isRetryable,
          reachedMaxAttempts: attempt >= opts.maxAttempts,
        });
        throw error;
      }

      // Calculate delay with exponential backoff
      const delay = Math.min(
        opts.initialDelayMs * Math.pow(opts.backoffMultiplier, attempt - 1),
        opts.maxDelayMs
      );

      logger.warn('Operation failed - retrying', {
        context,
        attempt,
        maxAttempts: opts.maxAttempts,
        error: error.message,
        retryInMs: delay,
      });

      await sleep(delay);
    }
  }

  throw lastError || new Error('Operation failed after all retry attempts');
}

/**
 * Sleep for specified milliseconds
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Circuit breaker for tracking service health
 */
export class CircuitBreaker {
  private failures: Map<string, number> = new Map();
  private lastFailureTime: Map<string, number> = new Map();
  private readonly failureThreshold: number;
  private readonly resetTimeMs: number;

  constructor(failureThreshold: number = 5, resetTimeMs: number = 60000) {
    this.failureThreshold = failureThreshold;
    this.resetTimeMs = resetTimeMs;
  }

  /**
   * Check if circuit is open (service is failing)
   */
  isOpen(key: string): boolean {
    const failures = this.failures.get(key) || 0;
    const lastFailure = this.lastFailureTime.get(key) || 0;
    const timeSinceLastFailure = Date.now() - lastFailure;

    // Reset if enough time has passed
    if (timeSinceLastFailure > this.resetTimeMs) {
      this.failures.set(key, 0);
      return false;
    }

    return failures >= this.failureThreshold;
  }

  /**
   * Record a failure
   */
  recordFailure(key: string): void {
    const currentFailures = this.failures.get(key) || 0;
    this.failures.set(key, currentFailures + 1);
    this.lastFailureTime.set(key, Date.now());

    if (currentFailures + 1 >= this.failureThreshold) {
      logger.warn('Circuit breaker opened', {
        key,
        failures: currentFailures + 1,
        threshold: this.failureThreshold,
      });
    }
  }

  /**
   * Record a success
   */
  recordSuccess(key: string): void {
    const hadFailures = (this.failures.get(key) || 0) > 0;
    this.failures.set(key, 0);
    
    if (hadFailures) {
      logger.info('Circuit breaker reset', { key });
    }
  }

  /**
   * Get current failure count
   */
  getFailureCount(key: string): number {
    return this.failures.get(key) || 0;
  }
}
