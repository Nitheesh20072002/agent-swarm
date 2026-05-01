
import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { logger } from './utils/logger';
import { errorHandler } from './middleware/errorHandler';
import { notFound } from './middleware/notFound';
import { requestLogger } from './middleware/requestLogger';
import authRoutes from './routes/auth';
import agentRoutes from './routes/agents';
import conversationRoutes from './routes/conversations';
import healthRoutes from './routes/health';

/**
 * Create and configure Express application
 */
export function createApp(): Application {
  const app = express();

  // Security middleware
  app.use(helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", "data:", "https:"],
      },
    },
    crossOriginEmbedderPolicy: false,
  }));

  // CORS configuration
  app.use(cors({
    origin: config.cors.origins,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  }));

  // Rate limiting - only enable in production
  if (config.env === 'production') {
    const limiter = rateLimit({
      windowMs: 15 * 60 * 1000, // 15 minutes
      max: 100,
      message: 'Too many requests from this IP, please try again later.',
      standardHeaders: true,
      legacyHeaders: false,
    });
    app.use('/api', limiter);
    logger.info('Rate limiting enabled for production');
  } else {
    logger.info('Rate limiting disabled for development');
  }

  // Body parsing middleware
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));

  // Request logging
  app.use(requestLogger);

  // Health and monitoring endpoints (no auth required)
  app.use('/health', healthRoutes);

  // API routes
  app.use(`${config.apiUrl}/auth`, authRoutes);
  app.use(`${config.apiUrl}/agents`, agentRoutes);
  app.use(`${config.apiUrl}/conversations`, conversationRoutes);

  // 404 handler
  app.use(notFound);

  // Global error handler (must be last)
  app.use(errorHandler);

  return app;
}
