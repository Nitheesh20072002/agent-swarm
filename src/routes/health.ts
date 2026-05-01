
/**
 * Health and Monitoring Endpoints
 * Provides system health checks and performance metrics
 */

import { Router } from 'express';
import { healthCheck, getPoolStats } from '../database/client';
import { performanceMonitor } from '../utils/performance';
import { contextCache, agentCache, userCache } from '../utils/cache';
import { logger } from '../utils/logger';

const router = Router();

/**
 * Basic health check
 * GET /health
 */
router.get('/', async (req, res) => {
  try {
    const dbHealthy = await healthCheck();
    
    res.json({
      status: dbHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      database: dbHealthy ? 'connected' : 'disconnected',
    });
  } catch (error) {
    logger.error('Health check failed', { error });
    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: 'Service unavailable',
    });
  }
});

/**
 * Detailed metrics endpoint
 * GET /health/metrics
 */
router.get('/metrics', async (req, res) => {
  try {
    // Database pool stats
    const poolStats = getPoolStats();
    
    // Cache stats
    const cacheStats = {
      context: contextCache.getStats(),
      agent: agentCache.getStats(),
      user: userCache.getStats(),
    };
    
    // Performance stats
    const perfStats = Array.from(performanceMonitor.getAllStats()).reduce(
      (acc, [operation, stats]) => {
        if (stats) {
          acc[operation] = {
            count: stats.count,
            avgMs: Math.round(stats.avgDuration),
            p95Ms: Math.round(stats.p95Duration),
            maxMs: Math.round(stats.maxDuration),
          };
        }
        return acc;
      },
      {} as Record<string, any>
    );
    
    // System info
    const systemInfo = {
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      nodeVersion: process.version,
      platform: process.platform,
    };
    
    res.json({
      timestamp: new Date().toISOString(),
      database: {
        pool: poolStats,
      },
      cache: cacheStats,
      performance: perfStats,
      system: systemInfo,
    });
  } catch (error) {
    logger.error('Metrics endpoint failed', { error });
    res.status(500).json({
      error: 'Failed to retrieve metrics',
    });
  }
});

/**
 * Performance summary
 * GET /health/performance
 */
router.get('/performance', async (req, res) => {
  try {
    const summary = performanceMonitor.getSummary();
    
    res.json({
      timestamp: new Date().toISOString(),
      summary,
      detailed: Array.from(performanceMonitor.getAllStats()).reduce(
        (acc, [operation, stats]) => {
          if (stats) {
            acc[operation] = stats;
          }
          return acc;
        },
        {} as Record<string, any>
      ),
    });
  } catch (error) {
    logger.error('Performance endpoint failed', { error });
    res.status(500).json({
      error: 'Failed to retrieve performance data',
    });
  }
});

/**
 * Cache statistics
 * GET /health/cache
 */
router.get('/cache', async (req, res) => {
  try {
    res.json({
      timestamp: new Date().toISOString(),
      caches: {
        context: contextCache.getStats(),
        agent: agentCache.getStats(),
        user: userCache.getStats(),
      },
    });
  } catch (error) {
    logger.error('Cache stats endpoint failed', { error });
    res.status(500).json({
      error: 'Failed to retrieve cache statistics',
    });
  }
});

export default router;
