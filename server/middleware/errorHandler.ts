import { Request, Response, NextFunction } from 'express';

interface ApiError extends Error {
  status?: number;
  statusCode?: number;
}

/**
 * Global error handling middleware
 */
export function errorHandler(
  error: ApiError,
  req: Request,
  res: Response,
  next: NextFunction
) {
  const status = error.status || error.statusCode || 500;
  const message = error.message || 'Internal Server Error';

  console.error(`[ERROR] ${status} - ${message}`);
  console.error(error.stack);

  res.status(status).json({
    success: false,
    error: message,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Async handler wrapper to catch errors
 */
export function asyncHandler(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}
