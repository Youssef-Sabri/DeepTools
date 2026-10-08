import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🔄 Creating dedicated administrator account...');

  const emails = ['admin@deeptools.ai', 'admin@dataforge.com'];
  const password = process.env.ADMIN_SEED_PASSWORD || 'admin1234';
  const name = 'System Administrator';

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(password, salt);

  for (const email of emails) {
    await prisma.user.upsert({
      where: { email },
      update: {
        role: 'admin',
        password: hashedPassword,
      },
      create: {
        name,
        email,
        password: hashedPassword,
        role: 'admin',
      },
    });
    console.log(`✅ Admin account: ${email} | Password: ${password}`);
  }

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ Failed to create admin:', err);
  await prisma.$disconnect();
  process.exit(1);
});
