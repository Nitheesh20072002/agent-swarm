
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../services/AuthService';
import { getCurrentUser } from '../middleware/auth';
import { logger } from '../utils/logger';

/**
 * Authentication Controller
 * Handles HTTP requests for authentication
 */
export class AuthController {
  private authService: AuthService;

  constructor() {
    this.authService = new AuthService();
  }

  /**
   * Register a new user
   * POST /api/v1/auth/register
   */
  register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password, username, name } = req.body;

      const result = await this.authService.register({
        email,
        password,
        name: username || name, // Use username if provided, fallback to name
      });

      res.status(201).json({
        status: 'success',
        message: 'User registered successfully',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Login user
   * POST /api/v1/auth/login
   */
  login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { email, password } = req.body;

      const result = await this.authService.login({
        email,
        password,
      });

      res.status(200).json({
        status: 'success',
        message: 'Login successful',
        data: result,
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Get current user
   * GET /api/v1/auth/me
   */
  getCurrentUser = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getCurrentUser(req);

      res.status(200).json({
        status: 'success',
        data: { user },
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Logout user
   * POST /api/v1/auth/logout
   */
  logout = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // With JWT, logout is handled on the client side by removing the token
      // We can implement token blacklisting here if needed with Redis
      
      const user = getCurrentUser(req);
      logger.info('User logged out', { userId: user.id });

      res.status(200).json({
        status: 'success',
        message: 'Logout successful',
      });
    } catch (error) {
      next(error);
    }
  };

  /**
   * Refresh token
   * POST /api/v1/auth/refresh
   */
  refreshToken = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const user = getCurrentUser(req);

      // Generate new token
      const token = (this.authService as any).generateToken({
        userId: user.id,
        email: user.email,
      });

      res.status(200).json({
        status: 'success',
        message: 'Token refreshed successfully',
        data: {
          token,
          expiresIn: '7d',
        },
      });
    } catch (error) {
      next(error);
    }
  };
}
