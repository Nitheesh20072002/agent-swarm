
import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { logger } from '../utils/logger';
import { config } from '../config';
import { performanceMonitor } from '../utils/performance';

// PostgreSQL connection pool
let poolInstance: Pool | null = null;

// Export pool getter for repositories
export const pool = {
  query: async <T extends QueryResultRow = any>(text: string, params?: any[]) => {
    return query<T>(text, params);
  }
};

export function getDatabasePool(): Pool {
  if (!poolInstance) {
    const poolConfig = {
      connectionString: config.database.url,
      max: parseInt(process.env.DB_POOL_MAX || '20'), // Maximum connections
      min: parseInt(process.env.DB_POOL_MIN || '2'), // Minimum connections
      idleTimeoutMillis: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
      connectionTimeoutMillis: parseInt(process.env.DB_CONNECTION_TIMEOUT || '2000'),
      // Enable query timeout for long-running queries
      query_timeout: parseInt(process.env.DB_QUERY_TIMEOUT || '30000'),
    };

    poolInstance = new Pool(poolConfig);

    // Log pool errors
    poolInstance.on('error', (err) => {
      logger.error('Unexpected database pool error', err);
    });

    // Log pool connections (for monitoring)
    poolInstance.on('connect', () => {
      logger.debug('New database connection established', {
        total: poolInstance?.totalCount,
        idle: poolInstance?.idleCount,
        waiting: poolInstance?.waitingCount,
      });
    });

    // Graceful shutdown
    process.on('beforeExit', async () => {
      await disconnectDatabase();
    });

    logger.info('Database pool created', poolConfig);
  }

  return poolInstance;
}

export async function initializeDatabase(): Promise<void> {
  try {
    const dbPool = getDatabasePool();
    const client = await dbPool.connect();
    
    // Test connection
    await client.query('SELECT NOW()');
    client.release();
    
    logger.info('Database connected successfully');
  } catch (error) {
    logger.error('Failed to connect to database', error);
    throw error;
  }
}

export async function connectDatabase(): Promise<void> {
  return initializeDatabase();
}

export async function closeDatabasePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
    logger.info('Database pool closed');
  }
}

export async function disconnectDatabase(): Promise<void> {
  return closeDatabasePool();
}

export async function healthCheck(): Promise<boolean> {
  try {
    const dbPool = getDatabasePool();
    const result = await dbPool.query('SELECT 1 as health');
    return result.rows[0].health === 1;
  } catch (error) {
    logger.error('Database health check failed', error);
    return false;
  }
}

/**
 * Get pool statistics for monitoring
 */
export function getPoolStats() {
  if (!poolInstance) {
    return null;
  }

  return {
    totalCount: poolInstance.totalCount,
    idleCount: poolInstance.idleCount,
    waitingCount: poolInstance.waitingCount,
  };
}

/**
 * Execute a query with logging
 * This function logs every query for transparency
 */
export async function query<T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  return performanceMonitor.timeAsync(
    'database.query',
    async () => {
      const start = Date.now();
      const dbPool = getDatabasePool();

      try {
        const result = await dbPool.query<T>(text, params);
        const duration = Date.now() - start;

        // Log query in development
        if (config.env === 'development') {
          logger.debug('Database Query', {
            query: text.substring(0, 100),
            params: params,
            duration: `${duration}ms`,
            rows: result.rowCount,
          });
        }

        // Warn on slow queries
        if (duration > 1000) {
          logger.warn('Slow database query detected', {
            query: text.substring(0, 100),
            duration: `${duration}ms`,
            rows: result.rowCount,
          });
        }

        return result;
      } catch (error) {
        const duration = Date.now() - start;
        logger.error('Database Query Failed', {
          query: text.substring(0, 100),
          params: params,
          duration: `${duration}ms`,
          error: error instanceof Error ? error.message : String(error),
        });
        throw error;
      }
    },
    { queryLength: text.length }
  );
}

/**
 * Execute a query with a specific client (for transactions)
 */
export async function queryWithClient<T extends QueryResultRow = any>(
  client: PoolClient,
  text: string,
  params?: any[]
): Promise<QueryResult<T>> {
  const start = Date.now();

  try {
    const result = await client.query<T>(text, params);
    const duration = Date.now() - start;

    if (config.env === 'development') {
      logger.debug('Database Query (Transaction)', {
        query: text,
        params: params,
        duration: `${duration}ms`,
        rows: result.rowCount,
      });
    }

    return result;
  } catch (error) {
    const duration = Date.now() - start;
    logger.error('Database Query Failed (Transaction)', {
      query: text,
      params: params,
      duration: `${duration}ms`,
      error: error instanceof Error ? error.message : String(error),
    });
    throw error;
  }
}

/**
 * Get a client from the pool for transactions
 */
export async function getClient(): Promise<PoolClient> {
  const dbPool = getDatabasePool();
  return await dbPool.connect();
}

/**
 * Execute multiple queries in a transaction
 */
export async function transaction<T>(
  callback: (client: PoolClient) => Promise<T>
): Promise<T> {
  const client = await getClient();

  try {
    await client.query('BEGIN');
    logger.debug('Transaction started');

    const result = await callback(client);

    await client.query('COMMIT');
    logger.debug('Transaction committed');

    return result;
  } catch (error) {
    await client.query('ROLLBACK');
    logger.error('Transaction rolled back', error);
    throw error;
  } finally {
    client.release();
  }
}
