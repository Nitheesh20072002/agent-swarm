
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { nanoid } from 'nanoid';
import { config } from '../config';
import { logger } from '../utils/logger';
import { UserRepository } from '../repositories/UserRepository';
import {
  UnauthorizedError,
  ConflictError,
  BadRequestError,
} from '../utils/errors';

// JWT payload interface
export interface JwtPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

// User data returned after authentication
export interface AuthUser {
  id: string;
  userId: string; // Alias for id for convenience
  email: string;
  name: string | null;
  createdAt: Date;
}

// Registration input
export interface RegisterInput {
  email: string;
  password: string;
  name?: string;
}

// Login input
export interface LoginInput {
  email: string;
  password: string;
}

// Auth response with token
export interface AuthResponse {
  user: AuthUser;
  token: string;
  expiresIn: string;
}

/**
 * Authentication Service
 * Handles user registration, login, and JWT token management
 */
export class AuthService {
  private userRepository: UserRepository;

  constructor() {
    this.userRepository = new UserRepository();
  }

  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const { email, password, name } = input;

    // Validate email format
    if (!this.isValidEmail(email)) {
      throw new BadRequestError('Invalid email format');
    }

    // Validate password strength
    if (!this.isValidPassword(password)) {
      throw new BadRequestError(
        'Password must be at least 8 characters long and contain letters and numbers'
      );
    }

    // Check if user already exists
    const existingUser = await this.userRepository.findByEmail(email);
    if (existingUser) {
      throw new ConflictError('User with this email already exists');
    }

    // Hash password
    const passwordHash = await this.hashPassword(password);

    // Create user
    const user = await this.userRepository.create({
      email,
      name: name || undefined,
      passwordHash,
    });

    logger.info('User registered successfully', { userId: user.id, email: user.email });

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
      expiresIn: config.jwt.expiry,
    };
  }

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const { email, password } = input;

    // Find user by email
    const user = await this.userRepository.findByEmail(email);
    if (!user) {
      throw new UnauthorizedError('Invalid email or password');
    }

    // Verify password
    const isPasswordValid = await this.verifyPassword(password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedError('Invalid email or password');
    }

    logger.info('User logged in successfully', { userId: user.id, email: user.email });

    // Generate JWT token
    const token = this.generateToken({
      userId: user.id,
      email: user.email,
    });

    return {
      user: {
        id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      },
      token,
      expiresIn: config.jwt.expiry,
    };
  }

  /**
   * Verify JWT token and return user data
   */
  async verifyToken(token: string): Promise<AuthUser> {
    try {
      // Verify and decode token
      const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;

      // Get user from database
      const user = await this.userRepository.findById(decoded.userId);
      if (!user) {
        throw new UnauthorizedError('User not found');
      }

      return {
        id: user.id,
        userId: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt,
      };
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new UnauthorizedError('Invalid token');
      }
      if (error instanceof jwt.TokenExpiredError) {
        throw new UnauthorizedError('Token expired');
      }
      throw error;
    }
  }

  /**
   * Hash password using bcrypt
   */
  private async hashPassword(password: string): Promise<string> {
    const saltRounds = 10;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  private async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate JWT token
   */
  private generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
    return jwt.sign(payload, config.jwt.secret, {
      expiresIn: config.jwt.expiry,
    } as jwt.SignOptions);
  }

  /**
   * Validate email format
   */
  private isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }

  /**
   * Validate password strength
   */
  private isValidPassword(password: string): boolean {
    // At least 8 characters, contains letters and numbers
    return password.length >= 8 && /[a-zA-Z]/.test(password) && /\d/.test(password);
  }

  /**
   * Generate random session ID
   */
  generateSessionId(): string {
    return nanoid(32);
  }
}
