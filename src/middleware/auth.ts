
import { Request, Response, NextFunction } from 'express';
import { AuthService, AuthUser } from '../services/AuthService';
import { UnauthorizedError } from '../utils/errors';
import { logger } from '../utils/logger';

// Extend Express Request to include user
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

// Export AuthRequest type for use in controllers
export interface AuthRequest extends Request {
  user: AuthUser;
}

/**
 * Authentication middleware
 * Verifies JWT token and attaches user to request
 */
export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    // Get token from Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      throw new UnauthorizedError('Authorization header missing');
    }

    // Check if it's a Bearer token
    if (!authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedError('Invalid authorization format. Use: Bearer <token>');
    }

    // Extract token
    const token = authHeader.substring(7);
    if (!token) {
      throw new UnauthorizedError('Token missing');
    }

    // Verify token and get user
    const authService = new AuthService();
    const user = await authService.verifyToken(token);

    // Attach user to request
    req.user = user;

    // Log authentication
    logger.debug('User authenticated', {
      userId: user.id,
      email: user.email,
      path: req.path,
    });

    next();
  } catch (error) {
    // Pass error to error handler
    next(error);
  }
}

/**
 * Optional authentication middleware
 * Attaches user if token is present, but doesn't fail if not
 */
export async function optionalAuthMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      
      if (token) {
        const authService = new AuthService();
        const user = await authService.verifyToken(token);
        req.user = user;
      }
    }
    
    next();
  } catch (error) {
    // Don't fail, just continue without user
    logger.debug('Optional auth failed, continuing without user', { error });
    next();
  }
}

/**
 * Get current user from request
 * Throws error if user is not authenticated
 */
export function getCurrentUser(req: Request): AuthUser {
  if (!req.user) {
    throw new UnauthorizedError('User not authenticated');
  }
  return req.user;
}

/**
 * Check if request has authenticated user
 */
export function isAuthenticated(req: Request): boolean {
  return !!req.user;
}
