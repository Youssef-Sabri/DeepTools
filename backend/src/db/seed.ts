import fs from "fs";
import path from "path";
import { PrismaClient, Role, ProductStatus, OrderStatus } from "@prisma/client";
import bcrypt from "bcryptjs";
import * as dotenv from "dotenv";

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  if (process.env.NODE_ENV === "production") {
    throw new Error("Database seeding is disabled in production environments");
  }
  const existingCategories = await prisma.category.count().catch(() => 0);
  const existingProducts = await prisma.product.count().catch(() => 0);

  if (
    existingCategories > 0 &&
    existingProducts > 0 &&
    process.env.FORCE_SEED !== "true"
  ) {
    console.log(
      "ℹ️ Database already contains seed data. Skipping initial seeding.",
    );
    console.log("   (Set FORCE_SEED=true to force re-seeding).");
    await prisma.$disconnect();
    return;
  }

  console.log("🧹 Clearing all existing database records...");

  // 1. Clean up existing operational records in correct foreign-key dependency order
  await prisma.paymentEvent.deleteMany().catch(() => {});
  await prisma.order.deleteMany();
  await prisma.license.deleteMany();
  await prisma.product.deleteMany();
  await prisma.passwordResetToken.deleteMany();

  console.log("🌱 Seeding verified users, products, and licenses...");

  // 2. Hash credentials using bcrypt cost 12 with strong passwords matching validation rules
  const adminPasswordHash = await bcrypt.hash("Admin1234!", 12);
  const buyerPasswordHash = await bcrypt.hash("Password123!", 12);

  // 3. Seed Verified Admin / Seller
  const verifiedSeller = await prisma.user.upsert({
    where: { email: "admin@deeptools.ai" },
    update: {
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      tokenVersion: 0,
    },
    create: {
      name: "DeepTools Verified Seller",
      email: "admin@deeptools.ai",
      passwordHash: adminPasswordHash,
      role: Role.ADMIN,
      tokenVersion: 0,
    },
  });

  // 4. Seed Regular Buyer User for instant testing
  const testBuyer = await prisma.user.upsert({
    where: { email: "buyer@deeptools.io" },
    update: {
      passwordHash: buyerPasswordHash,
      role: Role.USER,
      tokenVersion: 0,
    },
    create: {
      name: "Alex Vance (Engineer)",
      email: "buyer@deeptools.io",
      passwordHash: buyerPasswordHash,
      role: Role.USER,
      tokenVersion: 0,
    },
  });

  // 5. Seed Canonical Bilingual Categories
  console.log("📁 Seeding canonical bilingual categories...");
  const catWorkflow = await prisma.category.upsert({
    where: { slug: "workflow" },
    update: {
      name: "Workflows",
      nameAr: "سيناريوهات العمل",
      description: "Automated workflow blueprints and pipelines",
      descriptionAr: "مخططات ومسارات عمل مؤتمتة للأعمال",
    },
    create: {
      slug: "workflow",
      name: "Workflows",
      nameAr: "سيناريوهات العمل",
      description: "Automated workflow blueprints and pipelines",
      descriptionAr: "مخططات ومسارات عمل مؤتمتة للأعمال",
    },
  });

  const catAgentic = await prisma.category.upsert({
    where: { slug: "agentic" },
    update: {
      name: "AI Agents",
      nameAr: "وكلاء الذكاء الاصطناعي",
      description: "Autonomous reasoning and tool-using AI agents",
      descriptionAr: "وكلاء ذكاء اصطناعي تفاعليون ومستقلون لتنفيذ المهام",
    },
    create: {
      slug: "agentic",
      name: "AI Agents",
      nameAr: "وكلاء الذكاء الاصطناعي",
      description: "Autonomous reasoning and tool-using AI agents",
      descriptionAr: "وكلاء ذكاء اصطناعي تفاعليون ومستقلون لتنفيذ المهام",
    },
  });

  const catScript = await prisma.category.upsert({
    where: { slug: "script" },
    update: {
      name: "Automation Scripts",
      nameAr: "نصوص الأتمتة",
      description: "Python, Bash, and Node.js productivity automation scripts",
      descriptionAr: "سكربتات أتمتة برمجية بلغات بايثون، باش ونود جي إس",
    },
    create: {
      slug: "script",
      name: "Automation Scripts",
      nameAr: "نصوص الأتمتة",
      description: "Python, Bash, and Node.js productivity automation scripts",
      descriptionAr: "سكربتات أتمتة برمجية بلغات بايثون، باش ونود جي إس",
    },
  });

  const catCode = await prisma.category.upsert({
    where: { slug: "code" },
    update: {
      name: "Code Base",
      nameAr: "قواعد برمجية",
      description: "Modular templates, starter repositories, and SDK wrappers",
      descriptionAr: "قواعد وأطر برمجية معيارية وحزم تطوير متقدمة",
    },
    create: {
      slug: "code",
      name: "Code Base",
      nameAr: "قواعد برمجية",
      description: "Modular templates, starter repositories, and SDK wrappers",
      descriptionAr: "قواعد وأطر برمجية معيارية وحزم تطوير متقدمة",
    },
  });

  const categoryMap: Record<string, string> = {
    workflow: catWorkflow.id,
    agentic: catAgentic.id,
    script: catScript.id,
    code: catCode.id,
  };

  // 6. Seed 8 Canonical Marketplace Products
  console.log(
    "📦 Creating 8 bilingual products across canonical categories...",
  );

  const p1 = await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: ProductStatus.APPROVED,
      name: "n8n Self-Healing Microservice",
      nameAr: "سير عمل n8n المعالج الذاتي (Self-Healing Flow)",
      description:
        "Automated self-healing loop for Docker microservices with webhook alerts, dynamic container restarts, and Slack incident logging.",
      descriptionAr:
        "سير عمل آلي عبر n8n لمراقبة حاويات دوكر واستعادتها تلقائياً عند التوقف مع إشعارات مباشرة لقنوات سلاك.",
      category: "workflow",
      categoryId: categoryMap["workflow"],
      price: 4900, // $49.00
      badge: "Verified",
      badgeAr: "معتمد",
      version: "1.0.0",
      fileKey: "autoheal_n8n_flow.zip",
      approvedFileKey: "autoheal_n8n_flow.zip",
      fileSize: 4096,
      fileMime: "application/zip",
      approvedFileMime: "application/zip",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: ProductStatus.APPROVED,
      name: "DeepQuery AI Agent",
      nameAr: "وكيل ديب كويري للذكاء الاصطناعي (DeepQuery AI)",
      description:
        "Autonomous database optimization agent. Analyzes pg_stat_statements, evaluates slow query plans, and recommends missing indexes.",
      descriptionAr:
        "وكيل ذكاء اصطناعي مستقل يقوم بتحليل استعلامات قواعد البيانات البطيئة واقتراح الفهارس المثلى تلقائياً.",
      category: "agentic",
      categoryId: categoryMap["agentic"],
      price: 5900, // $59.00
      badge: "Featured",
      badgeAr: "مميز",
      version: "3.1.0",
      fileKey: "deepquery_ai_agent.zip",
      approvedFileKey: "deepquery_ai_agent.zip",
      fileSize: 2048,
      fileMime: "application/zip",
      approvedFileMime: "application/zip",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: ProductStatus.APPROVED,
      name: "Zero-Downtime Migration CLI",
      nameAr: "أداة ترحيل الجداول بدون توقف (Zero-Downtime CLI)",
      description:
        "High-throughput Python CLI executing zero-lock PostgreSQL table partitioning, schema rewrites, and ghost table swaps.",
      descriptionAr:
        "أداة بايثون متقدمة لتعديل وتقسيم جداول قواعد البيانات الضخمة دون أي قفل للجداول أو انقطاع في الخدمة.",
      category: "script",
      categoryId: categoryMap["script"],
      price: 3900, // $39.00
      badge: "Hot",
      badgeAr: "رائج",
      version: "1.5.0",
      fileKey: "zerodowntime_migration_cli.zip",
      approvedFileKey: "zerodowntime_migration_cli.zip",
      fileSize: 4096,
      fileMime: "application/zip",
      approvedFileMime: "application/zip",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: ProductStatus.APPROVED,
      name: "Distributed Lock Engine",
      nameAr: "محرك الأقفال الموزعة (Distributed Lock Engine)",
      description:
        "Production TypeScript engine for robust Redis & PostgreSQL advisory locks with TTL auto-renewal and dead-lock resolution.",
      descriptionAr:
        "محرك تايب سكريبت احترافي لإدارة الأقفال الموزعة بين خوادم التطبيقات لمنع تعارض المعاملات المتزامنة.",
      category: "code",
      categoryId: categoryMap["code"],
      price: 3500, // $35.00
      badge: "Enterprise",
      badgeAr: "للمؤسسات",
      version: "2.0.0",
      fileKey: "distributed_lock_engine.zip",
      approvedFileKey: "distributed_lock_engine.zip",
      fileSize: 1536,
      fileMime: "application/zip",
      approvedFileMime: "application/zip",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: ProductStatus.APPROVED,
      name: "Multi-Cloud Sync Pipeline",
      nameAr: "خط مزامنة البيانات السحابية المتعددة",
      description:
        "Bi-directional data sync pipeline between PostgreSQL, Supabase, and Snowflake with automated schema reconciliation.",
      descriptionAr:
        "خط تدفق بيانات لمزامنة قواعد البيانات السحابية المتعددة مع التوافق التلقائي للمخططات البيانية.",
      category: "workflow",
      categoryId: categoryMap["workflow"],
      price: 6900, // $69.00
      badge: null,
      badgeAr: null,
      version: "1.2.0",
      fileKey: "multicloud_sync_pipeline.zip",
      approvedFileKey: "multicloud_sync_pipeline.zip",
      fileSize: 8192,
      fileMime: "application/zip",
      approvedFileMime: "application/zip",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: ProductStatus.APPROVED,
      name: "Sentinel Security Agent",
      nameAr: "وكيل الحماية والحراسة سنتينل (Sentinel Agent)",
      description:
        "Proactive database audit agent detecting SQL injection vectors, privileged access deviations, and anomalous query exfiltration.",
      descriptionAr:
        "وكيل أمني لمراقبة قواعد البيانات وكشف ثغرات الحقن ومحاولات تسريب البيانات الشاذة في الوقت الحقيقي.",
      category: "agentic",
      categoryId: categoryMap["agentic"],
      price: 7900, // $79.00
      badge: "Security",
      badgeAr: "حماية فائقة",
      version: "2.1.0",
      fileKey: "sentinel_security_agent.zip",
      approvedFileKey: "sentinel_security_agent.zip",
      fileSize: 3072,
      fileMime: "application/zip",
      approvedFileMime: "application/zip",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: ProductStatus.APPROVED,
      name: "Postgres Vacuum Orchestrator",
      nameAr: "منسق التنظيف التلقائي لبوستجرس (Vacuum Orchestrator)",
      description:
        "Intelligent autovacuum scheduler dynamically tuning cost limits, workers, and memory allocation during peak production traffic.",
      descriptionAr:
        "سكربت جدولة ذكي لإدارة عمليات التنظيف التلقائي في بوستجرس دون التأثير على أداء أوقات الذروة.",
      category: "script",
      categoryId: categoryMap["script"],
      price: 2900, // $29.00
      badge: "New",
      badgeAr: "جديد",
      version: "1.0.0",
      fileKey: "postgres_vacuum_orchestrator.zip",
      approvedFileKey: "postgres_vacuum_orchestrator.zip",
      fileSize: 2048,
      fileMime: "application/zip",
      approvedFileMime: "application/zip",
    },
  });

  await prisma.product.create({
    data: {
      sellerId: verifiedSeller.id,
      status: ProductStatus.APPROVED,
      name: "Realtime CDC Streamer",
      nameAr: "بث تغييرات البيانات الفوري (CDC Streamer)",
      description:
        "Change Data Capture engine with Debezium and Kafka bindings for sub-millisecond replication and event-driven architectures.",
      descriptionAr:
        "محرك التقاط تغييرات البيانات في الوقت الحقيقي لبث التعديلات فورياً إلى أنظمة الحدث والتخزين التحليلي.",
      category: "code",
      categoryId: categoryMap["code"],
      price: 8900, // $89.00
      badge: "High Perf",
      badgeAr: "أداء فائق",
      version: "3.0.0",
      fileKey: "realtime_cdc_streamer.zip",
      approvedFileKey: "realtime_cdc_streamer.zip",
      fileSize: 12288,
      fileMime: "application/zip",
      approvedFileMime: "application/zip",
    },
  });

  // 6. Seed an initial Purchase & License for test buyer
  console.log(
    "🔑 Creating demo purchase & license key for buyer@deeptools.io...",
  );
  const sampleLicenseKey = "DF-9A4B-88F1-3CE7";
  const licenseExpires = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000);

  await prisma.license.create({
    data: {
      userId: testBuyer.id,
      productId: p1.id,
      licenseKey: sampleLicenseKey,
      fileKey: p1.approvedFileKey,
      fileMime: p1.approvedFileMime,
      isActive: true,
      expiresAt: licenseExpires,
    },
  });

  await prisma.order.create({
    data: {
      userId: testBuyer.id,
      productId: p1.id,
      sellerId: verifiedSeller.id,
      productName: p1.name,
      fileKey: p1.approvedFileKey,
      fileMime: p1.approvedFileMime,
      amount: p1.price,
      commissionPercent: 10,
      commissionAmount: 490,
      sellerAmount: 4410,
      status: OrderStatus.COMPLETED,
      paymentGateway: "simulated",
    },
  });

  // 7. Seed a pending product to test Admin Moderation Queue
  console.log("⏳ Seeding a pending product for Admin Moderation review...");
  await prisma.product.create({
    data: {
      sellerId: testBuyer.id,
      status: ProductStatus.PENDING,
      name: "Postgres Index Advisor CLI",
      nameAr: "أداة تحليل الفهارس الاستشارية لبوستجرس",
      description:
        "Lightweight Python utility that identifies duplicate and unused indexes and drafts drop statements.",
      descriptionAr:
        "أداة بايثون خفيفة لتحديد الفهارس غير المستخدمة والمكررة واقتراح أوامر الحذف الآمنة.",
      category: "script",
      categoryId: categoryMap["script"],
      price: 2500, // $25.00
      version: "1.0.0",
      fileKey: "postgres_vacuum_orchestrator.zip",
      fileSize: 2048,
      fileMime: "application/zip",
    },
  });

  // 8. Ensure mock physical archive files exist in UPLOAD_DIR so downloads work seamlessly
  const uploadDir = path.resolve(
    process.cwd(),
    process.env.UPLOAD_DIR || "./uploads",
  );
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }

  const sampleFiles = [
    "autoheal_n8n_flow.zip",
    "deepquery_ai_agent.zip",
    "zerodowntime_migration_cli.zip",
    "distributed_lock_engine.zip",
    "multi_cloud_sync_pipeline.zip",
    "multicloud_sync_pipeline.zip",
    "sentinel_security_agent.zip",
    "realtime_cdc_streamer.zip",
    "llm_guardrails_evaluator.zip",
    "k8s_cost_anomaly_bot.zip",
    "vector_embeddings_preprocessor.zip",
    "postgres_vacuum_orchestrator.zip",
  ];

  // Standard 22-byte empty valid ZIP archive
  const emptyZip = Buffer.from([
    0x50, 0x4b, 0x05, 0x06, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
    0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  ]);

  for (const file of sampleFiles) {
    const fullPath = path.join(uploadDir, file);
    if (!fs.existsSync(fullPath)) {
      fs.writeFileSync(fullPath, emptyZip);
    }
  }

  console.log("✅ Database refreshed and successfully seeded!");
  console.log("--------------------------------------------------");
  console.log("👉 Admin User : admin@deeptools.ai | Password: Admin1234!");
  console.log("👉 Buyer User : buyer@deeptools.io | Password: Password123!");
  console.log("--------------------------------------------------");

  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error("❌ Seeding failed:", err);
  await prisma.$disconnect();
  process.exit(1);
});
