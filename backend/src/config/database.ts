import { PrismaClient } from "@prisma/client";
import { env } from "./env";

// Query logging is opt-in via PRISMA_LOG_QUERIES=true so the CLI scripts in
// src/db stay readable.
const prismaClientSingleton = () => {
  const queryLogging = process.env.PRISMA_LOG_QUERIES === "true";

  return new PrismaClient({
    log: queryLogging
      ? ["query", "error", "warn"]
      : env.NODE_ENV === "production"
        ? ["error"]
        : ["error", "warn"],
  });
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
