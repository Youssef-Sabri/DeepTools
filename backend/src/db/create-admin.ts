import readline from "readline/promises";
import { stdin as input, stdout as output } from "process";
import bcrypt from "bcryptjs";
import { prisma } from "../config/database";
import { env } from "../config/env";
import { Role } from "@prisma/client";

async function bootstrap() {
  const rl = readline.createInterface({ input, output });

  console.log("\n========================================");
  console.log("      Admin Account Creation Tool       ");
  console.log("========================================\n");

  try {
    // 1. Prompt administrator credentials via CLI
    const name = await rl.question("Enter admin name: ");
    const email = await rl.question("Enter admin email: ");
    const password = await rl.question("Enter admin password: ");

    // 2. Validate required inputs
    if (!name || !email || !password) {
      throw new Error("All fields are required. Creation aborted.");
    }

    // 3. Ensure email uniqueness
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error(`The email ${email} is already registered.`);
    }

    // 4. Hash password with bcrypt cost factor >= 12
    const saltRounds = Number(env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. Persist administrator record in database
    const admin = await prisma.user.create({
      data: {
        name,
        email,
        passwordHash,
        role: Role.ADMIN,
      },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
      },
    });

    console.log("\n✅ Success! Admin account created successfully:");
    console.table(admin);
  } catch (error) {
    console.error(
      "\n❌ Error:",
      error instanceof Error ? error.message : "An unexpected error occurred",
    );
  } finally {
    // 6. Close readline interface and disconnect database client
    rl.close();
    await prisma.$disconnect();
  }
}

void bootstrap();
