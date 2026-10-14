import crypto from "crypto";
import jwt from "jsonwebtoken";
import { Request, Response } from "express";
import { env } from "../../config/env";

// HttpOnly; never read by client JS. Only the companion dt_csrf cookie is
// readable, which double-submit CSRF requires. Name per FRONTEND_RULES.md 2.
export const SESSION_COOKIE = "dt_auth";
export const CSRF_COOKIE = "dt_csrf";

export function readCookie(req: Request, name: string): string | undefined {
  const pair = req.headers.cookie
    ?.split(";")
    .map((item) => item.trim())
    .find((item) => item.startsWith(`${name}=`));
  if (!pair) return undefined;
  try {
    return decodeURIComponent(pair.slice(name.length + 1));
  } catch {
    return undefined;
  }
}

export function csrfForSession(token: string): string {
  return crypto
    .createHmac("sha256", env.JWT_SECRET)
    .update(`csrf:${token}`)
    .digest("hex");
}

export function safeEqual(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function validSessionCsrf(req: Request, token: string): boolean {
  const expected = csrfForSession(token);
  return (
    safeEqual(readCookie(req, CSRF_COOKIE), expected) &&
    safeEqual(req.header("X-CSRF-Token"), expected)
  );
}

export function setSession(res: Response, token: string): void {
  const options = {
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.cookie(SESSION_COOKIE, token, { ...options, httpOnly: true });
  res.cookie(CSRF_COOKIE, csrfForSession(token), {
    ...options,
    httpOnly: false,
  });
}

export function clearSession(res: Response): void {
  const options = {
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
  };
  res.clearCookie(SESSION_COOKIE, { ...options, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false });
}

export const GUEST_SESSION_COOKIE = "dt_guest_session";

export function signGuestSession(email: string): string {
  return jwt.sign({ guestEmail: email.toLowerCase().trim() }, env.JWT_SECRET, {
    expiresIn: "1h",
  });
}

export function verifyGuestSession(token: string): { email: string } | null {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET) as {
      guestEmail?: string;
    };
    if (!payload.guestEmail) return null;
    return { email: payload.guestEmail };
  } catch {
    return null;
  }
}

export function setGuestSession(res: Response, email: string): string {
  const token = signGuestSession(email);
  const options = {
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    httpOnly: true,
    maxAge: 60 * 60 * 1000, // 1 hour in milliseconds
  };
  res.cookie(GUEST_SESSION_COOKIE, token, options);
  return token;
}

export function clearGuestSession(res: Response): void {
  const options = {
    secure: env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    httpOnly: true,
  };
  res.clearCookie(GUEST_SESSION_COOKIE, options);
}

export function readGuestEmail(req: Request): string | undefined {
  const cookie = readCookie(req, GUEST_SESSION_COOKIE);
  const authHeader = req.headers.authorization;
  const bearerToken = authHeader?.startsWith("Bearer ")
    ? authHeader.slice(7)
    : undefined;
  const token = cookie || bearerToken;
  if (!token) return undefined;
  const verified = verifyGuestSession(token);
  return verified?.email;
}
