import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['warn', 'error'] : ['error'],
});

export const db = prisma;

export async function closeDatabase(): Promise<void> {
  await prisma.$disconnect();
}

export default prisma;
