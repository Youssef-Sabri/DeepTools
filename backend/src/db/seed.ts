import { PrismaClient } from '@prisma/client';
import * as dotenv from 'dotenv';

dotenv.config();

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting bilingual database seeding with Prisma...');

  // Clear existing products and templates to refresh with bilingual data
  await prisma.license.deleteMany();
  await prisma.product.deleteMany();
  await prisma.template.deleteMany();

  // 1. Seed Products (Bilingual EN & AR)
  console.log('Seeding bilingual products...');
  await prisma.product.createMany({
    data: [
      {
        name: 'QueryOptimizer AI',
        nameAr: 'مُحسّن الاستعلامات الذكي (QueryOptimizer AI)',
        description:
          'AI agent that automatically analyzes and optimizes slow SQL queries across PostgreSQL & SQL Server.',
        descriptionAr:
          'وكيل ذكاء اصطناعي يقوم بتحليل استعلامات SQL البطيئة وإعادة صياغتها واقتراح الفهارس تلقائياً لتسريع قواعد البيانات.',
        category: 'aiAgents',
        price: 4900, // $49.00
        badge: 'Popular',
        badgeAr: 'الأكثر طلباً',
        version: '2.1.0',
        downloadUrl: '#',
      },
      {
        name: 'DBGuard Monitor',
        nameAr: 'نظام مراقبة دي بي جارد (DBGuard Monitor)',
        description:
          'Real-time database monitoring with intelligent alerting, anomaly detection, and performance insights.',
        descriptionAr:
          'مراقبة لحظية لأداء قواعد البيانات مع تنبيهات ذكية وكشف الأخطاء والشذوذ وتحليل الأداء الفوري.',
        category: 'utilities',
        price: 2900, // $29.00
        badge: 'New',
        badgeAr: 'جديد',
        version: '1.2.0',
        downloadUrl: '#',
      },
      {
        name: 'MigrateFlow',
        nameAr: 'أداة ترحيل البيانات مايجريت فلو (MigrateFlow)',
        description:
          'Seamless database migration tool supporting cross-platform transfers with zero downtime.',
        descriptionAr:
          'ترحيل ونقل سلس لقواعد البيانات عبر مختلف المنصات والأنظمة دون أي انقطاع في الخدمة.',
        category: 'utilities',
        price: 3900, // $39.00
        badge: null,
        badgeAr: null,
        version: '1.0.0',
        downloadUrl: '#',
      },
      {
        name: 'DataClean Pro',
        nameAr: 'داتا كلين برو (DataClean Pro)',
        description:
          'Automated data quality tool with AI-powered deduplication, validation, and standardization.',
        descriptionAr:
          'أداة جودة بيانات مؤتمتة مدعومة بالذكاء الاصطناعي لإزالة التكرارات والتحقق من صحة البيانات وتوحيدها.',
        category: 'aiAgents',
        price: 3500, // $35.00
        badge: null,
        badgeAr: null,
        version: '1.1.0',
        downloadUrl: '#',
      },
      {
        name: 'SQL Script Library',
        nameAr: 'مكتبة سكربتات SQL الاحترافية',
        description:
          '500+ production-ready SQL scripts for DBA tasks, performance tuning, and maintenance.',
        descriptionAr:
          'أكثر من 500 سكربت SQL جاهز لبيئات الإنتاج لمهام مسؤولي قواعد البيانات وضبط الأداء والصيانة.',
        category: 'scripts',
        price: 1900, // $19.00
        badge: null,
        badgeAr: null,
        version: '5.0.0',
        downloadUrl: '#',
      },
      {
        name: 'ETL Pipeline Builder',
        nameAr: 'منشئ خطوط نقل ومعالجة البيانات (ETL Builder)',
        description:
          'Visual ETL pipeline designer with pre-built connectors for 50+ data sources.',
        descriptionAr:
          'واجهة بصرية لتصميم خطوط تدفق ومعالجة البيانات مع موصلات جاهزة لأكثر من 50 مصدراً للبيانات.',
        category: 'templates',
        price: 5900, // $59.00
        badge: 'Featured',
        badgeAr: 'مميز',
        version: '2.0.1',
        downloadUrl: '#',
      },
    ],
  });

  // 2. Seed Templates (Bilingual EN & AR)
  console.log('Seeding bilingual templates...');
  await prisma.template.createMany({
    data: [
      {
        name: 'PostgreSQL Auto-Tuner',
        nameAr: 'الموالف التلقائي لقواعد بيانات بوستجرس',
        description:
          'Automatically tunes PostgreSQL configuration parameters based on workload patterns and hardware resources.',
        descriptionAr:
          'يقوم بضبط إعدادات ومعاملات PostgreSQL تلقائياً بناءً على أنماط أعباء العمل وموارد الخادم.',
        category: 'postgresql',
        compatibility: ['PostgreSQL 14+', 'Linux', 'Docker'],
        version: '2.1.0',
        downloads: 2400,
        price: 0, // Free
        downloadUrl: '#',
      },
      {
        name: 'SQL Server Backup Orchestrator',
        nameAr: 'منسق النسخ الاحتياطي لـ SQL Server',
        description:
          'Complete backup automation with full, differential, and log backups. Supports Azure Blob Storage and S3.',
        descriptionAr:
          'أتمتة كاملة لعمليات النسخ الاحتياطي الكامل والتفاضلي وسجلات المعاملات مع دعم Azure و S3.',
        category: 'backup',
        compatibility: ['SQL Server 2019+', 'Windows', 'Azure'],
        version: '3.0.1',
        downloads: 5100,
        price: 2900,
        downloadUrl: '#',
      },
      {
        name: 'ETL Pipeline Starter Kit',
        nameAr: 'حزمة بدء خطوط معالجة وتدفق البيانات (ETL)',
        description:
          'Production-ready ETL pipeline template with data validation, error handling, and monitoring built-in.',
        descriptionAr:
          'قالب جاهز لبيئات العمل مع آليات التحقق من البيانات والتعامل مع الأخطاء والمراقبة المتكاملة.',
        category: 'etl',
        compatibility: ['Python 3.10+', 'PostgreSQL', 'Any OS'],
        version: '1.5.0',
        downloads: 3800,
        price: 1900,
        downloadUrl: '#',
      },
      {
        name: 'Real-Time DB Monitor',
        nameAr: 'لوحة مراقبة قواعد البيانات اللحظية',
        description:
          'Comprehensive monitoring dashboard with Grafana integration, alerting, and performance baselines.',
        descriptionAr:
          'لوحة تحكم شاملة للمراقبة مع تكامل Grafana والتنبيهات المباشرة ومؤشرات قياس الأداء.',
        category: 'monitoring',
        compatibility: ['PostgreSQL', 'MySQL', 'Docker', 'Grafana'],
        version: '2.0.0',
        downloads: 4200,
        price: 0, // Free
        downloadUrl: '#',
      },
      {
        name: 'CI/CD Database Deployer',
        nameAr: 'خط نشر قواعد البيانات المستمر (CI/CD)',
        description:
          'GitOps-style database deployment pipeline with migration management, rollback support, and testing.',
        descriptionAr:
          'خط نشر وإدارة هجرات قواعد البيانات بأسلوب GitOps مع دعم التراجع السريع والاختبارات التلقائية.',
        category: 'devops',
        compatibility: ['GitHub Actions', 'PostgreSQL', 'SQL Server'],
        version: '1.8.0',
        downloads: 1900,
        price: 3900,
        downloadUrl: '#',
      },
      {
        name: 'AI Query Advisor',
        nameAr: 'مستشار الاستعلامات المدعوم بالذكاء الاصطناعي',
        description:
          'ML-powered query analysis template that identifies slow queries and suggests optimizations.',
        descriptionAr:
          'قالب تحليل استعلامات مدعوم بتعلم الآلة لاكتشاف الاستعلامات البطيئة واقتراح أفضل التحسينات.',
        category: 'ai',
        compatibility: ['Python 3.10+', 'PostgreSQL', 'SQL Server'],
        version: '1.2.0',
        downloads: 2700,
        price: 4900,
        downloadUrl: '#',
      },
    ],
  });

  console.log('✅ Bilingual seeding completed successfully!');
  await prisma.$disconnect();
}

main().catch(async (err) => {
  console.error('❌ Seeding failed:', err);
  await prisma.$disconnect();
  process.exit(1);
});
