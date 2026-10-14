import { Request, Response, NextFunction } from "express";
import {
  SupportedLanguage,
  TranslationKey,
  t,
  DEFAULT_LANGUAGE,
} from "../utils/i18n";

declare global {
  namespace Express {
    interface Request {
      language: SupportedLanguage;
      locale: SupportedLanguage;
      t: (
        key: TranslationKey | (string & {}),
        params?: Record<string, string | number>,
      ) => string;
    }
  }
}

/**
 * Parses the Accept-Language header per RFC 7231 / RFC 4647,
 * respecting language quality weights (q-factors).
 */
export function parseAcceptLanguage(header?: string): SupportedLanguage | null {
  if (!header || typeof header !== "string") return null;

  const entries = header
    .split(",")
    .map((entry) => {
      const [langPart, qPart] = entry.trim().split(";");
      const lang = langPart.trim().toLowerCase();
      let q = 1.0;
      if (qPart) {
        const match = qPart.match(/q=([\d.]+)/);
        if (match) {
          const parsedQ = parseFloat(match[1]);
          if (!isNaN(parsedQ)) q = parsedQ;
        }
      }
      return { lang, q };
    })
    .sort((a, b) => b.q - a.q);

  for (const entry of entries) {
    if (entry.lang.startsWith("ar")) return "ar";
    if (entry.lang.startsWith("en")) return "en";
  }

  return null;
}

/**
 * Detects the request language from:
 * 1. Explicit query parameter (?lang=ar or ?locale=ar)
 * 2. Explicit custom headers (X-Locale or X-Language)
 * 3. Standard HTTP Accept-Language header with q-factor sorting
 * 4. Default fallback: "en"
 */
export function resolveRequestLanguage(req: Request): SupportedLanguage {
  // 1. Query parameter
  const queryLang = (req.query?.lang || req.query?.locale) as
    string | undefined;
  if (queryLang && typeof queryLang === "string") {
    const clean = queryLang.trim().toLowerCase();
    if (clean.startsWith("ar")) return "ar";
    if (clean.startsWith("en")) return "en";
  }

  // 2. Custom header
  const customHeader = (req.headers["x-locale"] ||
    req.headers["x-language"]) as string | undefined;
  if (customHeader && typeof customHeader === "string") {
    const clean = customHeader.trim().toLowerCase();
    if (clean.startsWith("ar")) return "ar";
    if (clean.startsWith("en")) return "en";
  }

  // 3. Accept-Language header
  const headerLang = parseAcceptLanguage(req.headers["accept-language"]);
  if (headerLang) return headerLang;

  // 4. Default
  return DEFAULT_LANGUAGE;
}

/**
 * Express middleware that initializes request localization context.
 */
export function localeMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const resolvedLang = resolveRequestLanguage(req);

  req.language = resolvedLang;
  req.locale = resolvedLang;
  req.t = (
    key: TranslationKey | (string & {}),
    params?: Record<string, string | number>,
  ) => t(key, resolvedLang, params);

  // Inform clients and HTTP caches of localized content
  res.setHeader("Content-Language", resolvedLang);

  const existingVary = res.getHeader("Vary");
  if (!existingVary) {
    res.setHeader("Vary", "Accept-Language");
  } else if (
    typeof existingVary === "string" &&
    !existingVary.includes("Accept-Language")
  ) {
    res.setHeader("Vary", `${existingVary}, Accept-Language`);
  }

  next();
}
