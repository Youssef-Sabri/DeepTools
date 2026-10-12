import fs from "fs";
import path from "path";
import { prisma } from "../config/database";
import { OrderStatus, ProductStatus } from "@prisma/client";
import { env } from "../config/env";

async function main() {
  const [products, licenses, orders] = await Promise.all([
    prisma.product.findMany({ select: { fileKey: true, approvedFileKey: true } }),
    prisma.license.findMany({ select: { fileKey: true } }),
    prisma.order.findMany({ select: { fileKey: true } }),
  ]);
  const references = new Set<string>();
  for (const item of products) {
    if (item.fileKey) references.add(path.basename(item.fileKey));
    if (item.approvedFileKey) references.add(path.basename(item.approvedFileKey));
  }
  for (const item of [...licenses, ...orders]) {
    if (item.fileKey) references.add(path.basename(item.fileKey));
  }

  const uploadDir = path.resolve(process.cwd(), env.UPLOAD_DIR);
  const files = await fs.promises.readdir(uploadDir).catch((error: NodeJS.ErrnoException) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });
  const present = new Set(files);
  const missing = [...references].filter((name) => !present.has(name));
  const oldOrphans: string[] = [];
  for (const name of files) {
    if (references.has(name)) continue;
    const file = await fs.promises.stat(path.join(uploadDir, name));
    if (file.isFile() && Date.now() - file.mtimeMs > 24 * 60 * 60 * 1000) oldOrphans.push(name);
  }
  const [licensesWithoutApprovedAsset, approvedProductsWithoutAsset, completedOrdersWithoutSeller] = await Promise.all([
    prisma.license.findMany({ where: { fileKey: null, product: { approvedFileKey: null } }, select: { id: true } }),
    prisma.product.findMany({ where: { status: ProductStatus.APPROVED, deletedAt: null, approvedFileKey: null }, select: { id: true } }),
    prisma.order.findMany({ where: { status: OrderStatus.COMPLETED, sellerId: null }, select: { id: true } }),
  ]);
  const anomalies = {
    missingReferencedFiles: missing,
    unreferencedFilesOlderThanOneDay: oldOrphans,
    licensesWithoutApprovedAsset: licensesWithoutApprovedAsset.map((item) => item.id),
    approvedProductsWithoutAsset: approvedProductsWithoutAsset.map((item) => item.id),
    completedOrdersWithoutSeller: completedOrdersWithoutSeller.map((item) => item.id),
  };
  console.log(JSON.stringify(anomalies, null, 2));
  if (missing.length || licensesWithoutApprovedAsset.length || approvedProductsWithoutAsset.length || completedOrdersWithoutSeller.length) process.exitCode = 1;
}

main().catch((error) => {
  console.error("Storage audit failed:", error);
  process.exitCode = 1;
}).finally(() => prisma.$disconnect());
