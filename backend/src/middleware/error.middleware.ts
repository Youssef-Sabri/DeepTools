/* eslint-disable @typescript-eslint/no-unused-vars */
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/apiError';

interface ErrorWithStatus extends Error {
  statusCode?: number;
  status?: number;
  errors?: unknown;
}

export const errorMiddleware = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const statusCode =
    typeof err.statusCode === 'number'
      ? err.statusCode
      : typeof err.status === 'number'
        ? err.status
        : 500;

  // Sanitize 500 message to prevent leaking internal database / system details (Section 4, 9)
  const message =
    statusCode === 500
      ? 'Internal Server Error'
      : err.message || 'Error occurred';

  if (statusCode === 500) {
    console.error(
      `[Error ${req.id || 'unknown'}] ${req.method} ${req.originalUrl}:`,
      err,
    );
  }

  res.status(statusCode).json({
    success: false,
    statusCode,
    message,
    errors: err.errors || [],
  });
};
