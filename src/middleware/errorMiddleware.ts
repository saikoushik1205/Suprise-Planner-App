import type { NextFunction, Request, Response } from 'express';

import { AppError } from '../utils/AppError.js';

export function notFoundHandler(_req: Request, _res: Response, next: NextFunction) {
  next(new AppError('Route not found.', 404));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  const isProduction = process.env.NODE_ENV === 'production';
  const isAppError = error instanceof AppError;
  const statusCode = isAppError ? error.statusCode : 500;
  const message = isAppError
    ? error.message
    : isProduction
      ? 'Something went wrong.'
      : error instanceof Error
        ? error.message
        : 'Something went wrong.';

  res.status(statusCode).json({
    success: false,
    message,
  });
}
