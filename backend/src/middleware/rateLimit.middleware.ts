import rateLimit from "express-rate-limit";

/**
 * Strict rate limiter for sensitive authentication & payment operations.
 * Allows 20 requests per 15 minutes per IP.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20, // Limit each IP to 20 requests per windowMs
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
  message: {
    success: false,
    statusCode: 429,
    message:
      "Too many attempts from this IP, please try again after 15 minutes",
  },
});

/**
 * General API rate limiter for standard endpoints.
 * Allows 100 requests per minute per IP.
 */
export const generalRateLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests, please slow down",
  },
});
