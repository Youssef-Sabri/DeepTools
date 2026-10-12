import crypto from "crypto";
import bcrypt from "bcryptjs";
import { PrismaClient, Prisma, Role } from "@prisma/client";
import { config } from "dotenv";

config();
const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production" || process.env.ALLOW_DEMO_SEED !== "true") {
    throw new Error("Demo seed requires ALLOW_DEMO_SEED=true and a non-production environment");
  }
  const dbUrl = new URL(process.env.DATABASE_URL ?? "");
  if (!["localhost", "127.0.0.1"].includes(dbUrl.hostname)) {
    throw new Error("Demo seed may only connect to a local database");
  }

  const adminPassword = crypto.randomBytes(24).toString("base64url");
  const buyerPassword = crypto.randomBytes(24).toString("base64url");
  const [adminHash, buyerHash] = await Promise.all([
    bcrypt.hash(adminPassword, 12), bcrypt.hash(buyerPassword, 12),
  ]);

  await prisma.$transaction(async (tx) => {
    const counts = await Promise.all([
      tx.user.count(), tx.product.count(), tx.order.count(), tx.license.count(),
    ]);
    if (counts.some((count) => count !== 0)) throw new Error("Demo seed requires an empty database");
    await tx.user.create({ data: {
      name: "Demo Administrator", email: "admin@deeptools.local",
      passwordHash: adminHash, role: Role.ADMIN,
    } });
    await tx.user.create({ data: {
      name: "Demo Buyer", email: "buyer@deeptools.local",
      passwordHash: buyerHash, role: Role.USER,
    } });
  }, { isolationLevel: Prisma.TransactionIsolationLevel.Serializable });

  // Only local, opt-in demo credentials are printed once for the operator.
  console.log(`Demo admin: admin@deeptools.local / ${adminPassword}`);
  console.log(`Demo buyer: buyer@deeptools.local / ${buyerPassword}`);
  console.log("No products were seeded because no verified demo files are bundled.");
}

main().catch((error) => {
  console.error("Demo seed failed:", error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
