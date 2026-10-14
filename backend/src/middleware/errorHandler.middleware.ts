import { Request, Response, NextFunction, ErrorRequestHandler } from "express";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import { t } from "../utils/i18n";

// Raw error messages are echoed only when EXPOSE_ERROR_DETAILS is explicitly
// enabled, so a NODE_ENV misconfiguration cannot re-enable the leak.
function shouldExposeErrorDetails(): boolean {
  return env.EXPOSE_ERROR_DETAILS;
}

export const errorHandler: ErrorRequestHandler = (
  err: Error,
  req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = req.headers["x-request-id"] || "unknown";
  const lang = req.language || "en";

  if (res.headersSent || res.destroyed) {
    if (!res.destroyed) res.destroy(err);
    return;
  }

  if (err instanceof ApiError) {
    const localizedMessage = t(err.message, lang);
    res.status(err.statusCode).json({
      success: false,
      statusCode: err.statusCode,
      message: localizedMessage,
      errors: err.errors,
    });
    return;
  }

  // Log the real error server-side; never echo it back by default.
  console.error(
    `[Request ${String(requestId)}] Unexpected Error:`,
    err.message,
  );

  const fallbackMessage = shouldExposeErrorDetails()
    ? err.message || t("Internal server error", lang)
    : t("Internal server error", lang);

  res.status(500).json({
    success: false,
    statusCode: 500,
    message: fallbackMessage,
    errors: [],
  });
};
