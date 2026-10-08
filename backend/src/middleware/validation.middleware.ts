import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { BadRequestError } from '../utils/apiError';

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
        return next(new BadRequestError(message, error.issues));
      }
      next(error);
    }
  };
};
