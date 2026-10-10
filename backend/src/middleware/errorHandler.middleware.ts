import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = req.headers["x-request-id"] || "unknown";

  if (err instanceof ApiError) {
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: err.message,
      errors: err.errors,
    });
    return;
  }

  // Safe logging: log message and request ID without leaking secrets or passwords
  console.error(
    `[Request ${String(requestId)}] Unexpected Error:`,
    err.message,
  );

  res.status(500).json({
    success: false,
    statusCode: 500,
    message:
      env.NODE_ENV === "production"
        ? "Internal server error"
        : err.message || "Internal server error",
    errors: [],
  });
};
