import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import { ApiError } from "../utils/apiError";
import { env } from "../config/env";
import { Role } from "@prisma/client";
import { prisma } from "../config/database";
import { SESSION_COOKIE, readCookie, validSessionCsrf } from "../modules/auth/session";

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
  tokenVersion: number;
}

// Verify JWT and attach user payload to request
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> => {
  const authHeader = req.headers.authorization;
  const cookieToken = readCookie(req, SESSION_COOKIE);
  const bearerToken = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : undefined;
  const token = cookieToken || bearerToken;
  if (!token) {
    return next(
      ApiError.unauthorized("Authentication token is missing or invalid"),
    );
  }

  if (cookieToken && !["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    if (!validSessionCsrf(req, cookieToken)) {
      return next(ApiError.forbidden("CSRF verification failed"));
    }
  }

  let decoded: JwtPayload;
  try {
    decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload;
  } catch {
    return next(ApiError.unauthorized("Invalid or expired token"));
  }
  if (typeof decoded.sub !== "string" || !Number.isInteger(decoded.tokenVersion)) {
    return next(ApiError.unauthorized("Invalid or expired token"));
  }
  try {
    const user = await prisma.user.findUnique({ where: { id: decoded.sub }, select: { id: true, role: true, deletedAt: true, tokenVersion: true } });
    if (!user || user.deletedAt || user.tokenVersion !== decoded.tokenVersion) {
      return next(ApiError.unauthorized("Invalid or expired token"));
    }
    req.user = { id: user.id, role: user.role };
    next();
  } catch (error) {
    next(error);
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
