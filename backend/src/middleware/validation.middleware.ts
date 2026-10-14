import { Request, Response, NextFunction } from "express";
import { AnyZodObject, ZodError, ZodSchema } from "zod";
import { ApiError } from "../utils/apiError";

/**
 * Turn a ZodError into the flat, field-annotated message shape the API
 * contract expects: `{ "field": "...", "message": "..." }`.
 */
function formatIssues(
  error: ZodError,
): Array<{ field: string; message: string }> {
  return error.issues.map((issue) => ({
    field: issue.path.join(".").replace(/^body\.|^query\.|^params\./, ""),
    message: issue.message,
  }));
}

/** Raise a 422 carrying the individual field errors. */
function unprocessable(error: ZodError, scope: string): ApiError {
  const issues = formatIssues(error);
  const message = issues
    .map((i) => `${i.field || scope}: ${i.message}`)
    .join(", ");
  return ApiError.unprocessable(message, issues);
}

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(unprocessable(error, "body"));
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      Object.defineProperty(req, "query", {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(unprocessable(error, "query"));
      }
      next(error);
    }
  };
};

export const validateParams = (schema: ZodSchema) => {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return next(unprocessable(error, "params"));
      }
      next(error);
    }
  };
};

// Validate incoming request schema
export const validate = (schema: AnyZodObject) => {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      const parsed = schema.parse({
        body: req.body,
        query: req.query,
        params: req.params,
      });

      // Update body directly
      if (parsed.body) {
        req.body = parsed.body;
      }

      // Safe update for query and params to avoid read-only setter error
      if (parsed.query) {
        Object.assign(req.query, parsed.query);
      }
      if (parsed.params) {
        Object.assign(req.params, parsed.params);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(unprocessable(error, "body"));
      } else {
        next(error);
      }
    }
  };
};
