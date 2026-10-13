import { prisma } from "../config/database";

async function tableExists(name: string): Promise<boolean> {
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public' AND table_name = ${name}
    ) AS "exists"
  `;
  return rows[0].exists;
}

async function migrationApplied(name: string): Promise<boolean> {
  if (!(await tableExists("_prisma_migrations"))) return false;
  const rows = await prisma.$queryRaw<Array<{ exists: boolean }>>`
    SELECT EXISTS (
      SELECT 1 FROM "_prisma_migrations"
      WHERE migration_name = ${name} AND finished_at IS NOT NULL AND rolled_back_at IS NULL
    ) AS "exists"
  `;
  return rows[0].exists;
}

async function main() {
  if (!(await migrationApplied("20261010161519_improve_schema_security"))) {
    // That historical migration drops status and download URL columns. Do not
    // run it automatically against a populated pre-migration database.
    for (const table of ["orders", "products"]) {
      if (!(await tableExists(table))) continue;
      const rows = await prisma.$queryRawUnsafe<Array<{ count: bigint }>>(
        `SELECT COUNT(*) AS count FROM "${table}"`,
      );
      if (rows[0].count > 0n) {
        throw new Error(`Migration preflight stopped: ${table} contains data and the historical destructive migration is pending. Back up and migrate the old columns manually first.`);
      }
    }
  }

  if ((await tableExists("licenses")) && !(await migrationApplied("20261012075124_add_license_unique_constraint"))) {
    const duplicates = await prisma.$queryRaw<Array<{ count: bigint }>>`
      SELECT COUNT(*) AS count FROM (
        SELECT user_id, product_id FROM licenses
        GROUP BY user_id, product_id HAVING COUNT(*) > 1
      ) AS duplicates
    `;
    if (duplicates[0].count > 0n) {
      throw new Error("Migration preflight stopped: duplicate licenses exist. Audit and reconcile them before applying the unique constraint.");
    }
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : "Migration preflight failed");
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
