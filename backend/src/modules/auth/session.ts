import crypto from "crypto";
import { Request, Response } from "express";
import { env } from "../../config/env";

export const SESSION_COOKIE = "dt_session";
export const CSRF_COOKIE = "dt_csrf";

export function readCookie(req: Request, name: string): string | undefined {
  const pair = req.headers.cookie?.split(";").map((item) => item.trim()).find((item) => item.startsWith(`${name}=`));
  if (!pair) return undefined;
  try { return decodeURIComponent(pair.slice(name.length + 1)); } catch { return undefined; }
}

export function csrfForSession(token: string): string {
  return crypto.createHmac("sha256", env.JWT_SECRET).update(`csrf:${token}`).digest("hex");
}

export function safeEqual(a: string | undefined, b: string): boolean {
  if (!a) return false;
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

export function validSessionCsrf(req: Request, token: string): boolean {
  const expected = csrfForSession(token);
  return safeEqual(readCookie(req, CSRF_COOKIE), expected) && safeEqual(req.header("X-CSRF-Token"), expected);
}

export function setSession(res: Response, token: string): void {
  const options = { secure: env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  res.cookie(SESSION_COOKIE, token, { ...options, httpOnly: true });
  res.cookie(CSRF_COOKIE, csrfForSession(token), { ...options, httpOnly: false });
}

export function clearSession(res: Response): void {
  const options = { secure: env.NODE_ENV === "production", sameSite: "lax" as const, path: "/" };
  res.clearCookie(SESSION_COOKIE, { ...options, httpOnly: true });
  res.clearCookie(CSRF_COOKIE, { ...options, httpOnly: false });
}
