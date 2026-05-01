
/**
 * Performance Monitoring Utility
 * Tracks operation timing, query performance, and resource usage
 */

import { logger } from './logger';

export interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: any;
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric[]> = new Map();
  private readonly maxMetricsPerOperation = 100;

  /**
   * Time an async operation
   */
  async timeAsync<T>(
    operation: string,
    fn: () => Promise<T>,
    metadata?: any
  ): Promise<T> {
    const startTime = Date.now();
    
    try {
      const result = await fn();
      const duration = Date.now() - startTime;
      
      this.recordMetric(operation, duration, metadata);
      
      // Log slow operations
      if (duration > 1000) {
        logger.warn('Slow operation detected', {
          operation,
          duration: `${duration}ms`,
          metadata,
        });
      }
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Time a synchronous operation
   */
  timeSync<T>(
    operation: string,
    fn: () => T,
    metadata?: any
  ): T {
    const startTime = Date.now();
    
    try {
      const result = fn();
      const duration = Date.now() - startTime;
      
      this.recordMetric(operation, duration, metadata);
      
      return result;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.recordMetric(operation, duration, { ...metadata, error: true });
      throw error;
    }
  }

  /**
   * Record a performance metric
   */
  private recordMetric(operation: string, duration: number, metadata?: any): void {
    const metric: PerformanceMetric = {
      operation,
      duration,
      timestamp: new Date(),
      metadata,
    };

    // Get or create metrics array for this operation
    let operationMetrics = this.metrics.get(operation);
    if (!operationMetrics) {
      operationMetrics = [];
      this.metrics.set(operation, operationMetrics);
    }

    // Add metric
    operationMetrics.push(metric);

    // Trim if exceeds max
    if (operationMetrics.length > this.maxMetricsPerOperation) {
      operationMetrics.shift();
    }
  }

  /**
   * Get statistics for an operation
   */
  getStats(operation: string): {
    count: number;
    avgDuration: number;
    minDuration: number;
    maxDuration: number;
    p95Duration: number;
    p99Duration: number;
  } | null {
    const metrics = this.metrics.get(operation);
    if (!metrics || metrics.length === 0) {
      return null;
    }

    const durations = metrics.map(m => m.duration).sort((a, b) => a - b);
    const count = durations.length;
    const sum = durations.reduce((acc, d) => acc + d, 0);

    return {
      count,
      avgDuration: sum / count,
      minDuration: durations[0],
      maxDuration: durations[count - 1],
      p95Duration: durations[Math.floor(count * 0.95)],
      p99Duration: durations[Math.floor(count * 0.99)],
    };
  }

  /**
   * Get all operation statistics
   */
  getAllStats(): Map<string, ReturnType<typeof this.getStats>> {
    const allStats = new Map();
    
    for (const operation of this.metrics.keys()) {
      const stats = this.getStats(operation);
      if (stats) {
        allStats.set(operation, stats);
      }
    }
    
    return allStats;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics.clear();
  }

  /**
   * Clear metrics for a specific operation
   */
  clearOperation(operation: string): void {
    this.metrics.delete(operation);
  }

  /**
   * Get metrics summary for logging
   */
  getSummary(): string {
    const allStats = this.getAllStats();
    const lines: string[] = ['Performance Summary:'];
    
    for (const [operation, stats] of allStats) {
      if (stats) {
        lines.push(
          `  ${operation}: ` +
          `count=${stats.count}, ` +
          `avg=${stats.avgDuration.toFixed(2)}ms, ` +
          `p95=${stats.p95Duration.toFixed(2)}ms, ` +
          `max=${stats.maxDuration.toFixed(2)}ms`
        );
      }
    }
    
    return lines.join('\n');
  }
}

// Export singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Decorator for timing class methods
 */
export function Timed(operationName?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const operation = operationName || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = async function (...args: any[]) {
      return performanceMonitor.timeAsync(
        operation,
        () => originalMethod.apply(this, args),
        { method: propertyKey }
      );
    };

    return descriptor;
  };
}
