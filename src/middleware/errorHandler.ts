
import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';
import { AppError } from '../utils/errors';

/**
 * Global error handling middleware
 * Catches all errors and returns consistent error responses
 */
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  // Log the error
  logger.error('Error occurred', {
    error: err.message,
    stack: err.stack,
    path: req.path,
    method: req.method,
    ip: req.ip,
  });

  // Handle custom AppError
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      code: err.code,
      ...(err.details && { details: err.details }),
    });
    return;
  }

  // Handle JWT errors
  if (err.name === 'JsonWebTokenError') {
    res.status(401).json({
      status: 'error',
      message: 'Invalid token',
      code: 'INVALID_TOKEN',
    });
    return;
  }

  if (err.name === 'TokenExpiredError') {
    res.status(401).json({
      status: 'error',
      message: 'Token expired',
      code: 'TOKEN_EXPIRED',
    });
    return;
  }

  // Handle validation errors
  if (err.name === 'ValidationError') {
    res.status(400).json({
      status: 'error',
      message: 'Validation failed',
      code: 'VALIDATION_ERROR',
      details: err.message,
    });
    return;
  }

  // Handle database errors
  if (err.name === 'QueryFailedError') {
    res.status(500).json({
      status: 'error',
      message: 'Database operation failed',
      code: 'DATABASE_ERROR',
    });
    return;
  }

  // Default to 500 server error
  res.status(500).json({
    status: 'error',
    message: process.env.NODE_ENV === 'production' 
      ? 'Internal server error' 
      : err.message,
    code: 'INTERNAL_ERROR',
  });
}
