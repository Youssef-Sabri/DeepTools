import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),
  JWT_SECRET: z.string().min(1, 'JWT_SECRET is required and cannot be empty'),
  JWT_EXPIRATION: z.string().default('3600s'),
  JWT_REFRESH_SECRET: z
    .string()
    .min(1, 'JWT_REFRESH_SECRET is required and cannot be empty'),
  JWT_REFRESH_EXPIRATION: z.string().default('604800s'),
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000,http://localhost:4000')
    .transform((val) => val.split(',').map((origin) => origin.trim())),
});

const parsedEnv = envSchema.safeParse(process.env);

if (!parsedEnv.success) {
  const missingKeys = parsedEnv.error.issues
    .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
    .join('\n  ');
  console.error(
    `❌ [Fatal Config Error] Environment validation failed:\n  ${missingKeys}`,
  );
  process.exit(1);
}

export const env = parsedEnv.data;
