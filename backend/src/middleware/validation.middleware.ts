import { Request, Response, NextFunction } from 'express';
import { AnyZodObject, ZodError } from 'zod';
import { ApiError } from '../utils/apiError';

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