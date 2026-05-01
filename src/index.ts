
import { createServer, Server } from 'http';
import { config } from './config';
import { logger } from './utils/logger';
import { createApp } from './app';
import { initializeDatabase } from './database/client';
import { WebSocketService } from './services/WebSocketService';
import { setWebSocketService } from './services/websocket';
import { notificationService } from './services/NotificationService';

/**
 * Bootstrap the application
 */
async function bootstrap(): Promise<Server> {
  try {
    // Initialize database connection
    logger.info('Initializing database connection...');
    await initializeDatabase();
    logger.info('Database connection established');

    // Create Express app
    const app = createApp();

    // Create HTTP server
    const server = createServer(app);

    // Initialize WebSocket service
    const wsService = new WebSocketService(server);
    setWebSocketService(wsService);
    logger.info('WebSocket service initialized');

    // Initialize Notification service
    notificationService.initialize(
      {
        enabled: process.env.SMTP_HOST ? true : false,
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT) : 587,
        secure: false,
        auth: process.env.SMTP_USER ? {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASSWORD || '',
        } : undefined,
        from: process.env.SMTP_FROM || 'noreply@aiagentswarm.com',
      },
      {
        enabled: process.env.WEBHOOK_URLS ? true : false,
        urls: process.env.WEBHOOK_URLS ? process.env.WEBHOOK_URLS.split(',') : [],
      }
    );
    logger.info('Notification service initialized');

    // Start HTTP server
    server.listen(config.port, () => {
      logger.info('Server started successfully', {
        environment: config.env,
        port: config.port,
        apiVersion: config.apiVersion,
        nodeVersion: process.version,
      });

      logger.info(`🚀 Server is running at http://localhost:${config.port}`);
      logger.info(`📊 Health check: http://localhost:${config.port}/health`);
      logger.info(`🔧 API endpoint: http://localhost:${config.port}${config.apiUrl}`);
      logger.info(`🔌 WebSocket endpoint: ws://localhost:${config.port}/socket.io`);
    });

    // Graceful shutdown
    const gracefulShutdown = async (signal: string) => {
      logger.info(`${signal} received, starting graceful shutdown...`);

      server.close(async () => {
        logger.info('HTTP server closed');

        try {
          // Close database connections
          const { closeDatabasePool } = await import('./database/client');
          await closeDatabasePool();
          logger.info('Database connections closed');

          logger.info('Graceful shutdown completed');
          process.exit(0);
        } catch (error) {
          logger.error('Error during graceful shutdown', { error });
          process.exit(1);
        }
      });

      // Force shutdown after 10 seconds
      setTimeout(() => {
        logger.error('Forced shutdown after timeout');
        process.exit(1);
      }, 10000);
    };

    // Handle shutdown signals
    process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
    process.on('SIGINT', () => gracefulShutdown('SIGINT'));

    // Handle uncaught errors
    process.on('uncaughtException', (error: Error) => {
      logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
      process.exit(1);
    });

    process.on('unhandledRejection', (reason: any) => {
      logger.error('Unhandled Rejection', { reason });
      process.exit(1);
    });

    return server;
  } catch (error) {
    logger.error('Failed to start server', { error });
    process.exit(1);
  }
}

// Start the server
bootstrap().catch((error) => {
  logger.error('Bootstrap failed', { error });
  process.exit(1);
});
