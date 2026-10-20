import fs from "fs";
import path from "path";
import { prisma } from "../config/database";

async function main() {
  await prisma.$queryRaw`SELECT 1`;
  console.log("Database connectivity verified for migration preflight.");

  const migrationTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = current_schema()
        AND table_name = '_prisma_migrations'
    ) AS "exists"
  `;
  const localMigrations = fs
    .readdirSync(path.join(process.cwd(), "prisma", "migrations"), {
      withFileTypes: true,
    })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  if (migrationTable[0]?.exists) {
    const applied = await prisma.$queryRaw<Array<{ migration_name: string }>>`
      SELECT migration_name
      FROM "_prisma_migrations"
      WHERE finished_at IS NOT NULL AND rolled_back_at IS NULL
    `;
    const unknown = applied
      .map((row) => row.migration_name)
      .filter((name) => !localMigrations.includes(name));
    const hasAppliedMigrations = applied.length > 0;
    const baselineApplied = applied.some(
      (row) => row.migration_name === localMigrations[0],
    );
    if (unknown.length > 0 || (hasAppliedMigrations && !baselineApplied)) {
      throw new Error(
        `Database migration history does not match the checked-in baseline (${localMigrations[0]}). Unknown applied migrations: ${unknown.join(", ") || "none"}. Compare the database schema with prisma/schema.prisma and reconcile the migration ledger before running migrate deploy; do not mark the baseline applied until the schemas match.`,
      );
    }
  }

  const licenseTable = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = current_schema() AND table_name = 'licenses'
    ) AS "exists"
  `;
  if (!licenseTable[0]?.exists) return;

  const duplicates = await prisma.$queryRaw<
    Array<{ user_id: string; product_id: string; row_count: bigint }>
  >`
    SELECT user_id, product_id, COUNT(*) AS row_count
    FROM licenses
    WHERE user_id IS NOT NULL
    GROUP BY user_id, product_id
    HAVING COUNT(*) > 1
    LIMIT 10
  `;
  if (duplicates.length > 0) {
    throw new Error(
      `Cannot create the user/product license uniqueness constraint. Resolve duplicate licenses first: ${duplicates
        .map((row) => `${row.user_id}/${row.product_id} (${row.row_count})`)
        .join(", ")}`,
    );
  }
  console.log("Existing licenses pass the new uniqueness preflight.");
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
