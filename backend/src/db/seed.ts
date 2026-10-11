import { PrismaClient, Role } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log("🧹 Clearing all existing database records...");

  // 1. Clean up existing operational records in correct foreign-key dependency order
  await prisma.order.deleteMany();
  await prisma.license.deleteMany();
  await prisma.product.deleteMany();
  await prisma.passwordResetToken.deleteMany();

  console.log("🌱 Seeding verified users, products, and licenses...");

  // 2. Hash credentials
  const adminPasswordHash = await bcrypt.hash("admin1234", 10);
  const buyerPasswordHash = await bcrypt.hash("password123", 10);

  // 3. Seed Verified Admin / Seller
  const verifiedSeller = await prisma.user.upsert({
    where: { email: "admin@deeptools.ai" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
    create: {
      name: "DeepTools Verified Seller",
      email: "admin@deeptools.ai",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
    },
  });

  // 4. Seed Regular Buyer User for instant testing
  const testBuyer = await prisma.user.upsert({
    where: { email: "buyer@deeptools.io" },
    update: {
      passwordHash: buyerPasswordHash,
      role: Role.USER,
    },
    create: {
      name: "Alex Vance (Engineer)",
      email: "buyer@deeptools.io",
      passwordHash: buyerPasswordHash,
      role: Role.USER,
    },
  });

  // 5. Seed 8 Canonical Marketplace Products
  console.log("📦 Creating 8 bilingual products across canonical categories...");

  const p1 = await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: "approved",
      name: "AutoHeal n8n Flow",
      nameAr: "مسار المعالجة الذاتية n8n (AutoHeal Flow)",
      description:
        "Self-healing webhook recovery workflow for n8n. Retries with exponential backoff and routes poison-pill payloads to dead-letter queues.",
      descriptionAr:
        "مسار عمل ذكي لمعالجة أخطاء الويب هوك ذاتياً في n8n مع إعادة المحاولة التلقائية وعزل الرسائل التالفة.",
      category: "workflow",
      price: 4900, // $49.00
      badge: "Popular",
      badgeAr: "الأكثر طلباً",
      version: "2.4.0",
      fileKey: "autoheal_n8n_flow.zip",
      fileSize: 1024,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });

  const p2 = await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: "approved",
      name: "DeepQuery AI Agent",
      nameAr: "وكيل ديب كويري للذكاء الاصطناعي (DeepQuery AI)",
      description:
        "Autonomous database optimization agent. Analyzes pg_stat_statements, evaluates slow query plans, and recommends missing indexes.",
      descriptionAr:
        "وكيل ذكاء اصطناعي مستقل يقوم بتحليل استعلامات قواعد البيانات البطيئة واقتراح الفهارس المثلى تلقائياً.",
      category: "agentic",
      price: 5900, // $59.00
      badge: "Featured",
      badgeAr: "مميز",
      version: "3.1.0",
      fileKey: "deepquery_ai_agent.zip",
      fileSize: 2048,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: "approved",
      name: "Zero-Downtime Migration CLI",
      nameAr: "أداة ترحيل الجداول بدون توقف (Zero-Downtime CLI)",
      description:
        "High-throughput Python CLI executing zero-lock PostgreSQL table partitioning, schema rewrites, and ghost table swaps.",
      descriptionAr:
        "أداة بايثون متقدمة لتعديل وتقسيم جداول قواعد البيانات الضخمة دون أي قفل للجداول أو انقطاع في الخدمة.",
      category: "script",
      price: 3900, // $39.00
      badge: "Hot",
      badgeAr: "رائج",
      version: "1.5.0",
      fileKey: "zerodowntime_migration_cli.zip",
      fileSize: 4096,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: "approved",
      name: "Distributed Lock Engine",
      nameAr: "محرك الأقفال الموزعة (Distributed Lock Engine)",
      description:
        "Production TypeScript engine for robust Redis & PostgreSQL advisory locks with TTL auto-renewal and dead-lock resolution.",
      descriptionAr:
        "محرك تايب سكريبت احترافي لإدارة الأقفال الموزعة بين خوادم التطبيقات لمنع تعارض المعاملات المتزامنة.",
      category: "code",
      price: 3500, // $35.00
      badge: "Enterprise",
      badgeAr: "للمؤسسات",
      version: "2.0.0",
      fileKey: "distributed_lock_engine.zip",
      fileSize: 1536,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: "approved",
      name: "Multi-Cloud Sync Pipeline",
      nameAr: "خط مزامنة البيانات السحابية المتعددة",
      description:
        "Bi-directional data sync pipeline between PostgreSQL, Supabase, and Snowflake with automated schema reconciliation.",
      descriptionAr:
        "خط تدفق بيانات لمزامنة قواعد البيانات السحابية المتعددة مع التوافق التلقائي للمخططات البيانية.",
      category: "workflow",
      price: 6900, // $69.00
      badge: null,
      badgeAr: null,
      version: "1.2.0",
      fileKey: "multicloud_sync_pipeline.zip",
      fileSize: 8192,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: "approved",
      name: "Sentinel Security Agent",
      nameAr: "وكيل الحماية والحراسة سنتينل (Sentinel Agent)",
      description:
        "Proactive database audit agent detecting SQL injection vectors, privileged access deviations, and anomalous query exfiltration.",
      descriptionAr:
        "وكيل أمني لمراقبة قواعد البيانات وكشف ثغرات الحقن ومحاولات تسريب البيانات الشاذة في الوقت الحقيقي.",
      category: "agentic",
      price: 7900, // $79.00
      badge: "Security",
      badgeAr: "حماية فائقة",
      version: "2.1.0",
      fileKey: "sentinel_security_agent.zip",
      fileSize: 3072,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: "approved",
      name: "Postgres Vacuum Orchestrator",
      nameAr: "منسق التنظيف التلقائي لبوستجرس (Vacuum Orchestrator)",
      description:
        "Intelligent autovacuum scheduler dynamically tuning cost limits, workers, and memory allocation during peak production traffic.",
      descriptionAr:
        "سكربت جدولة ذكي لإدارة عمليات التنظيف التلقائي في بوستجرس دون التأثير على أداء أوقات الذروة.",
      category: "script",
      price: 2900, // $29.00
      badge: "New",
      badgeAr: "جديد",
      version: "1.0.0",
      fileKey: "postgres_vacuum_orchestrator.zip",
      fileSize: 2048,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: "approved",
      name: "Realtime CDC Streamer",
      nameAr: "بث تغييرات البيانات الفوري (CDC Streamer)",
      description:
        "Change Data Capture engine with Debezium and Kafka bindings for sub-millisecond replication and event-driven architectures.",
      descriptionAr:
        "محرك التقاط تغييرات البيانات في الوقت الحقيقي لبث التعديلات فورياً إلى أنظمة الحدث والتخزين التحليلي.",
      category: "code",
      price: 8900, // $89.00
      badge: "High Perf",
      badgeAr: "أداء فائق",
      version: "3.0.0",
      fileKey: "realtime_cdc_streamer.zip",
      fileSize: 12288,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });


  // 7. Seed an initial Purchase & License for test buyer
  console.log("🔑 Creating demo purchase & license key for buyer@deeptools.io...");
  const sampleLicenseKey = "DF-9A4B-88F1-3CE7";
  const licenseExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await prisma.license.create({
    data: {
      userId: testBuyer.id,
      productId: p1.id,
      licenseKey: sampleLicenseKey,
      isActive: true,
      expiresAt: licenseExpires,
    },
  });

  await prisma.order.create({
    data: {
      userId: testBuyer.id,
      productId: p1.id,
      amount: p1.price,
      commissionPercent: 10,
      commissionAmount: 490,
      sellerAmount: 4410,
      status: "completed",
      paymentGateway: "simulated",
    },
  });

  // 8. Seed a pending product to test Admin Moderation Queue
  console.log("⏳ Seeding a pending product for Admin Moderation review...");
  await prisma.product.create({
    data: {
      sellerId: testBuyer.id,
      status: "pending",
      name: "Postgres Index Advisor CLI",
      nameAr: "أداة تحليل الفهارس الاستشارية لبوستجرس",
      description:
        "Lightweight Python utility that identifies duplicate and unused indexes and drafts drop statements.",
      descriptionAr:
        "أداة بايثون خفيفة لتحديد الفهارس غير المستخدمة والمكررة واقتراح أوامر الحذف الآمنة.",
      category: "script",
      price: 2500, // $25.00
      version: "1.0.0",
      fileKey: "postgres_vacuum_orchestrator.zip",
      fileSize: 2048,
      fileMime: "application/zip",
      downloadUrl: "#",
    },
  });

  console.log("✅ Database refreshed and successfully seeded!");
  console.log("--------------------------------------------------");
  console.log("👉 Admin User : admin@deeptools.ai | Password: admin1234");
  console.log("👉 Buyer User : buyer@deeptools.io | Password: password123");
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ Seeding failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
