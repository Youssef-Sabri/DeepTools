/* eslint-disable @typescript-eslint/no-namespace */
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { prisma } from '../config/database';
import { UnauthorizedError, ForbiddenError } from '../utils/apiError';

declare global {
  namespace Express {
    interface User {
      id: string;
      name: string;
      email: string;
      role: string;
    }
    interface Request {
      user?: User;
    }
  }
}

export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next(
      new UnauthorizedError('Missing or invalid authorization header'),
    );
  }

  const token = authHeader.split(' ')[1];
  if (!token) {
    return next(new UnauthorizedError('Token not provided'));
  }

  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      sub: string;
      email: string;
      role?: string;
    };

    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
      },
    });

    if (!user) {
      return next(new UnauthorizedError('User not found or token invalid'));
    }

    req.user = user;
    next();
  } catch {
    return next(new UnauthorizedError('Invalid or expired token'));
  }
};

export const requireRole = (...allowedRoles: string[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(new UnauthorizedError('Authentication required'));
    }

    if (!allowedRoles.includes(req.user.role)) {
      return next(new ForbiddenError('Forbidden: Insufficient permissions'));
    }

    next();
  };
};
