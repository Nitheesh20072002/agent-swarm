
import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ValidationError } from '../utils/errors';
import { logger } from '../utils/logger';

/**
 * Validation middleware factory
 * Creates middleware that validates request against a Zod schema
 */
export function validate(schema: AnyZodObject) {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      // Validate request data against schema
      await schema.parseAsync({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        // Format Zod errors into readable format
        const errors = error.errors.map((err) => ({
          field: err.path.join('.'),
          message: err.message,
        }));

        logger.warn('Validation failed', {
          path: req.path,
          method: req.method,
          errors,
        });

        next(
          new ValidationError('Validation failed', {
            errors,
          })
        );
      } else {
        next(error);
      }
    }
  };
}

/**
 * Sanitize request body
 * Removes potentially dangerous fields
 */
export function sanitize(req: Request, res: Response, next: NextFunction): void {
  if (req.body) {
    // Remove common dangerous fields
    const dangerousFields = ['__proto__', 'constructor', 'prototype'];
    
    dangerousFields.forEach((field) => {
      if (field in req.body) {
        delete req.body[field];
      }
    });
  }

  next();
}
