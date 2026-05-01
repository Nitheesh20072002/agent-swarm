
/**
 * Custom application error class
 * Used for consistent error handling across the application
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly code: string;
  public readonly details?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code: string = 'INTERNAL_ERROR',
    details?: any
  ) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Predefined error classes for common scenarios
 */
export class BadRequestError extends AppError {
  constructor(message: string = 'Bad request', details?: any) {
    super(message, 400, 'BAD_REQUEST', details);
  }
}

export class UnauthorizedError extends AppError {
  constructor(message: string = 'Unauthorized', details?: any) {
    super(message, 401, 'UNAUTHORIZED', details);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Forbidden', details?: any) {
    super(message, 403, 'FORBIDDEN', details);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found', details?: any) {
    super(message, 404, 'NOT_FOUND', details);
  }
}

export class ConflictError extends AppError {
  constructor(message: string = 'Resource conflict', details?: any) {
    super(message, 409, 'CONFLICT', details);
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Validation failed', details?: any) {
    super(message, 422, 'VALIDATION_ERROR', details);
  }
}

export class DatabaseError extends AppError {
  constructor(message: string = 'Database operation failed', details?: any) {
    super(message, 500, 'DATABASE_ERROR', details);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service error', details?: any) {
    super(message, 502, 'EXTERNAL_SERVICE_ERROR', details);
  }
}
