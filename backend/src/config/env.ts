import dotenv from 'dotenv';

dotenv.config();

export const env = {
  PORT: process.env.PORT ? parseInt(process.env.PORT, 10) : 4000,
  DATABASE_URL:
    process.env.DATABASE_URL ||
    'postgresql://postgres:postgres@localhost:5439/dataforge_db',
  JWT_SECRET:
    process.env.JWT_SECRET || 'super-secret-jwt-key-change-this-in-production',
  JWT_EXPIRATION: process.env.JWT_EXPIRATION || '3600s',
  JWT_REFRESH_SECRET:
    process.env.JWT_REFRESH_SECRET || 'another-super-secret-refresh-key',
  JWT_REFRESH_EXPIRATION: process.env.JWT_REFRESH_EXPIRATION || '604800s',
  CORS_ORIGIN: process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',')
    : ['http://localhost:3000', 'http://localhost:4000'],
};
