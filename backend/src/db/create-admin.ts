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
    // 1. طلب البيانات من المستخدم في التيرمينال
    const name = await rl.question("Enter admin name: ");
    const email = await rl.question("Enter admin email: ");
    const password = await rl.question("Enter admin password: ");

    // 2. التحقق من أن الحقول غير فارغة
    if (!name || !email || !password) {
      throw new Error("All fields are required. Creation aborted.");
    }

    // 3. التحقق من عدم وجود الإيميل مسبقاً
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      throw new Error(`The email ${email} is already registered.`);
    }

    // 4. تشفير كلمة المرور حسب إعدادات البيئة (بتكلفة 12 أو أعلى)
    const saltRounds = Number(env.BCRYPT_SALT_ROUNDS) || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 5. إنشاء حساب الأدمن في قاعدة البيانات
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
    // 6. إغلاق الـ Terminal واشتراك الداتا بيز
    rl.close();
    await prisma.$disconnect();
  }
}

void bootstrap();
