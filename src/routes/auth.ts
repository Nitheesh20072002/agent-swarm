
import { Router } from 'express';
import { AuthController } from '../controllers/AuthController';
import { authMiddleware } from '../middleware/auth';
import { validate } from '../middleware/validate';
import { registerSchema, loginSchema } from '../validation/schemas';

const router = Router();
const authController = new AuthController();

/**
 * @route   POST /api/v1/auth/register
 * @desc    Register a new user
 * @access  Public
 */
router.post('/register', validate(registerSchema), authController.register);

/**
 * @route   POST /api/v1/auth/login
 * @desc    Login user
 * @access  Public
 */
router.post('/login', validate(loginSchema), authController.login);

/**
 * @route   GET /api/v1/auth/me
 * @desc    Get current user
 * @access  Private
 */
router.get('/me', authMiddleware, authController.getCurrentUser);

/**
 * @route   POST /api/v1/auth/logout
 * @desc    Logout user
 * @access  Private
 */
router.post('/logout', authMiddleware, authController.logout);

/**
 * @route   POST /api/v1/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', authMiddleware, authController.refreshToken);

export default router;
