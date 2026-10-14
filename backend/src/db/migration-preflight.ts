import { prisma } from "../config/database";

async function main() {
  // Verify database connection is responsive before executing migrations
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connectivity verified for migration preflight.");
}

main()
  .catch((error) => {
    console.error(
      "Migration preflight failed:",
      error instanceof Error ? error.message : error,
    );
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
