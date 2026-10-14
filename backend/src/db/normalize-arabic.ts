/**
 * Backfill normalized Arabic shadow columns for products and categories.
 * Run with: npm run db:normalize-arabic
 */
import { prisma } from "../config/database";
import { normalizeArabicText } from "../utils/localization";

async function main(): Promise<void> {
  console.log("Normalizing Arabic search projections...\n");

  const products = await prisma.product.findMany({
    select: { id: true, nameAr: true, descriptionAr: true },
  });

  let productUpdates = 0;
  for (const product of products) {
    const nameArNorm = product.nameAr
      ? normalizeArabicText(product.nameAr)
      : null;
    const descriptionArNorm = product.descriptionAr
      ? normalizeArabicText(product.descriptionAr)
      : null;

    if (nameArNorm === null && descriptionArNorm === null) continue;

    await prisma.product.update({
      where: { id: product.id },
      data: { nameArNorm, descriptionArNorm },
    });
    productUpdates += 1;
  }

  const categories = await prisma.category.findMany({
    select: { id: true, nameAr: true },
  });

  let categoryUpdates = 0;
  for (const category of categories) {
    await prisma.category.update({
      where: { id: category.id },
      data: { nameArNorm: normalizeArabicText(category.nameAr) },
    });
    categoryUpdates += 1;
  }

  console.log(`Products updated : ${productUpdates}/${products.length}`);
  console.log(`Categories updated: ${categoryUpdates}/${categories.length}`);
  console.log("\nDone.");
}

main()
  .catch((error) => {
    console.error("Arabic normalization backfill failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
