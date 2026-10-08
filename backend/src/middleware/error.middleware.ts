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

  const message = err.message || 'Internal Server Error';

  if (statusCode === 500) {
    console.error(`[Error] ${req.method} ${req.url}:`, err);
  }

  res.status(statusCode).json({
    statusCode,
    message,
    ...(err.errors ? { errors: err.errors } : {}),
  });
};
