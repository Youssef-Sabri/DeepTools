import { config } from 'dotenv';
import { z } from 'zod';

// Load variables from .env file
config();

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  PORT: z
    .string()
    .default('5000')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().positive()),

  // PostgreSQL connection string
  DATABASE_URL: z.string().min(1, 'DATABASE_URL is required'),

  // JWT configuration - fail if secret is missing or insecure
  JWT_SECRET: z.string().min(32, 'JWT_SECRET must be at least 32 characters long'),
  JWT_EXPIRES_IN: z.string().default('1h'),

  // Must be 12 or more per security requirements
  BCRYPT_SALT_ROUNDS: z
    .string()
    .default('12')
    .transform((val) => parseInt(val, 10))
    .pipe(z.number().min(12, 'BCRYPT_SALT_ROUNDS must be at least 12')),

  // CORS origins as comma-separated list, transformed to string array
  CORS_ORIGIN: z
    .string()
    .default('http://localhost:3000')
    .transform((val) => val.split(',').map((origin) => origin.trim())),
  UPLOAD_DIR: z.string().default('./uploads'),
  MAX_FILE_SIZE_MB: z.coerce.number().default(50),
  COMMISSION_PERCENT: z.coerce.number().min(0).max(100).default(10),
});

const parseEnv = () => {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    // Collect validation issues and terminate execution immediately
    const formattedErrors = result.error.format();
    console.error('CRITICAL: Environment variable validation failed:');
    console.error(JSON.stringify(formattedErrors, null, 2));
    process.exit(1);
  }

  return result.data;
};

export const env = parseEnv();
export type Env = z.infer<typeof envSchema>;
