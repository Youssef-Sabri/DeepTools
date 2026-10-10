import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError, ZodSchema } from 'zod';
import { ApiError } from '../utils/apiError';

class ValidationError extends ApiError {
  constructor(message: string, public errors: any[]) {
    super(422, message, false);
  }
}

export const validateBody = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((i) => `${i.path.join('.') || 'body'}: ${i.message}`)
          .join(', ');
        return next(new ValidationError(message, error.issues));
      }
      next(error);
    }
  };
};

export const validateQuery = (schema: ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse(req.query);
      Object.defineProperty(req, 'query', {
        value: parsed,
        writable: true,
        configurable: true,
        enumerable: true,
      });
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const message = error.issues
          .map((i) => `${i.path.join('.') || 'query'}: ${i.message}`)
          .join(', ');
        return next(new ValidationError(message, error.issues));
      }
      next(error);
    }
  };
};

// Validate incoming request schema
export const validate = (schema: AnyZodObject) => {
    return (req: Request, res: Response, next: NextFunction): void => {
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
                const errorMessages = error.errors.map((err) => ({
                    field: err.path.join('.').replace(/^body\.|^query\.|^params\./, ''),
                    message: err.message,
                }));

                next(ApiError.unprocessable('Validation failed', errorMessages));
            } else {
                next(error);
            }
        }
    };
};
