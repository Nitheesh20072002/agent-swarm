
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

      // Construct URLs for logging
      // If SERVER_URL is provided (matches frontend NEXT_PUBLIC_API_URL), use it
      // Otherwise, construct from localhost and port
      let baseUrl: string;
      let wsUrl: string;
      
      if (config.serverUrl) {
        // Use provided SERVER_URL (e.g., https://your-service.run.app)
        baseUrl = config.serverUrl;
        wsUrl = config.serverUrl.replace(/^http/, 'ws');
      } else {
        // Fallback to localhost construction
        baseUrl = `http://localhost:${config.port}`;
        wsUrl = `ws://localhost:${config.port}`;
      }

      logger.info(`🚀 Server is running on port ${config.port}`);
      logger.info(`📊 Health check: ${baseUrl}/health`);
      logger.info(`🔧 API endpoint: ${baseUrl}${config.apiUrl}`);
      logger.info(`🔌 WebSocket endpoint: ${wsUrl}/socket.io`);
      
      if (config.env === 'production') {
        logger.info(`💡 Production mode: Server is proxied through Cloud Run`);
        logger.info(`🌐 Allowed origins: ${config.cors.origins.join(', ')}`);
        if (config.serverUrl) {
          logger.info(`🔗 Public URL: ${config.serverUrl}`);
          logger.info(`🔌 WebSocket URL: ${wsUrl}/socket.io (configure NEXT_PUBLIC_WS_URL in frontend)`);
        }
      } else {
        logger.info(`💻 Development mode: Server accessible locally`);
      }
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
