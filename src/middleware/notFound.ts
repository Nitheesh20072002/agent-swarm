
import { Request, Response } from 'express';

/**
 * 404 Not Found handler
 * This middleware catches all requests that don't match any routes
 */
export function notFound(req: Request, res: Response): void {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
    code: 'NOT_FOUND',
    path: req.path,
    method: req.method,
  });
}
