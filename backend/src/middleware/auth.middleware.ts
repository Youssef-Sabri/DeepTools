import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import { Role } from "@prisma/client";

// Extend Express Request interface globally to include 'user'
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        role: Role;
      };
    }
  }
}

interface JwtPayload {
  sub: string;
  role: Role;
}

// Verify JWT and attach user payload to request
export const authenticate = (
  req: Request,
  res: Response,
  next: NextFunction,
): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return next(
      ApiError.unauthorized("Authentication token is missing or invalid"),
    );
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;

    req.user = {
      id: decoded.sub,
      role: decoded.role,
    };

    next();
  } catch {
    next(ApiError.unauthorized("Invalid or expired token"));
  }
};

// Check if authenticated user has one of the allowed roles
export const authorize = (allowedRoles: string[] | string) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      return next(ApiError.unauthorized("User is not authenticated"));
    }

    const rolesArray = Array.isArray(allowedRoles)
      ? allowedRoles
      : [allowedRoles];
    const normalizedAllowed = rolesArray.map((r) => String(r).toUpperCase());
    const userRole = String(req.user.role).toUpperCase();

    if (!normalizedAllowed.includes(userRole)) {
      return next(
        ApiError.forbidden(
          "You do not have permission to access this resource",
        ),
      );
    }

    next();
  };
};

export const requireRole = authorize;
