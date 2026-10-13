import crypto from "crypto";
import rateLimit, { MemoryStore, Store } from "express-rate-limit";
import { prisma } from "../config/database";

// PostgreSQL keeps limits consistent across API replicas. Test processes use an
// isolated memory store so unit tests do not need a running database.
class PostgresRateLimitStore implements Store {
  private windowMs = 60_000;
  private operations = 0;
  constructor(private readonly scope: string) {}

  init(options: { windowMs: number }) {
    this.windowMs = options.windowMs;
  }

  private hash(key: string) {
    return crypto
      .createHash("sha256")
      .update(`${this.scope}:${key}`)
      .digest("hex");
  }

  async increment(key: string) {
    const id = this.hash(key);
    const rows = await prisma.$queryRaw<
      Array<{ hits: number; reset_at: Date }>
    >`
      INSERT INTO rate_limit_buckets (key, hits, reset_at)
      VALUES (${id}, 1, NOW() + (${this.windowMs} * INTERVAL '1 millisecond'))
      ON CONFLICT (key) DO UPDATE SET
        hits = CASE WHEN rate_limit_buckets.reset_at <= NOW() THEN 1 ELSE rate_limit_buckets.hits + 1 END,
        reset_at = CASE WHEN rate_limit_buckets.reset_at <= NOW()
          THEN NOW() + (${this.windowMs} * INTERVAL '1 millisecond')
          ELSE rate_limit_buckets.reset_at END
      RETURNING hits, reset_at
    `;
    if (++this.operations % 1000 === 0) {
      await prisma.$executeRaw`DELETE FROM rate_limit_buckets WHERE reset_at < NOW() - INTERVAL '1 day'`;
    }
    return { totalHits: rows[0].hits, resetTime: rows[0].reset_at };
  }

  async decrement(key: string) {
    await prisma.$executeRaw`UPDATE rate_limit_buckets SET hits = GREATEST(0, hits - 1) WHERE key = ${this.hash(key)}`;
  }

  async resetKey(key: string) {
    await prisma.$executeRaw`DELETE FROM rate_limit_buckets WHERE key = ${this.hash(key)}`;
  }
}

const store = (scope: string): Store =>
  process.env.NODE_ENV === "test"
    ? new MemoryStore()
    : new PostgresRateLimitStore(scope);

export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  store: store("auth"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many attempts; try again later",
  },
});

export const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 100,
  store: store("api"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many requests; slow down",
  },
});

export const webhookRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 600,
  store: store("webhook"),
  standardHeaders: "draft-8",
  legacyHeaders: false,
  message: {
    success: false,
    statusCode: 429,
    message: "Too many webhook requests",
  },
});
