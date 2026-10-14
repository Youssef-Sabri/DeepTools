/** Voids surplus completed orders left by the guest-checkout race, without
 *  hard-deleting financial records. Dry run by default; pass -- --apply to write. */
import { OrderStatus, Prisma } from "@prisma/client";
import { prisma } from "../config/database";

interface DuplicateGroup {
  buyerEmail: string;
  productId: string;
  completedOrders: number;
  activeLicenses: number;
  surplus: number;
}

async function findDuplicateGroups(): Promise<DuplicateGroup[]> {
  const completed = await prisma.order.groupBy({
    by: ["buyerEmail", "productId"],
    where: {
      status: OrderStatus.COMPLETED,
      buyerEmail: { not: null },
      productId: { not: null },
    },
    _count: { _all: true },
  });

  const groups: DuplicateGroup[] = [];

  for (const row of completed) {
    if (!row.buyerEmail || !row.productId) continue;
    const completedOrders = row._count._all;
    if (completedOrders < 2) continue;

    const activeLicenses = await prisma.license.count({
      where: {
        productId: row.productId,
        buyerEmail: row.buyerEmail.toLowerCase(),
        isActive: true,
      },
    });

    // A group is a race artefact when orders outnumber real licenses.
    if (completedOrders > activeLicenses) {
      groups.push({
        buyerEmail: row.buyerEmail,
        productId: row.productId,
        completedOrders,
        activeLicenses,
        surplus: completedOrders - Math.max(activeLicenses, 1),
      });
    }
  }

  return groups;
}

async function main(): Promise<void> {
  const apply = process.argv.includes("--apply");

  const groups = await findDuplicateGroups();

  if (groups.length === 0) {
    console.log("No duplicate order groups found. Nothing to reconcile.");
    return;
  }

  console.log(
    `Found ${groups.length} (buyer, product) group(s) with more completed orders than active licenses.\n`,
  );

  let totalVoided = 0;
  let totalAmount = 0;
  let totalCommission = 0;

  for (const group of groups) {
    // Keep the oldest COMPLETED order; void the rest.
    const orders = await prisma.order.findMany({
      where: {
        buyerEmail: group.buyerEmail,
        productId: group.productId,
        status: OrderStatus.COMPLETED,
      },
      orderBy: [{ createdAt: "asc" }, { id: "asc" }],
      select: { id: true, amount: true, commissionAmount: true },
    });

    const keep = 1; // one real purchase per active license
    const surplus = orders.slice(keep);
    if (surplus.length === 0) continue;

    const amount = surplus.reduce((sum, o) => sum + o.amount, 0);
    const commission = surplus.reduce((sum, o) => sum + o.commissionAmount, 0);

    totalVoided += surplus.length;
    totalAmount += amount;
    totalCommission += commission;

    console.log(`  ${group.buyerEmail} / ${group.productId.slice(0, 8)}`);
    console.log(
      `    completed=${group.completedOrders} activeLicenses=${group.activeLicenses} -> void ${surplus.length}`,
    );
    console.log(
      `    reverses gross=${amount}c commission=${commission}c  (${apply ? "APPLYING" : "dry run"})`,
    );

    if (apply) {
      try {
        await prisma.order.updateMany({
          where: {
            id: { in: surplus.map((o) => o.id) },
            status: OrderStatus.COMPLETED,
          },
          data: { status: OrderStatus.CANCELLED },
        });
      } catch (error) {
        // Never let one bad group abort the reconciliation.
        console.error(
          `    FAILED to void ${surplus.length} order(s) for ${group.buyerEmail}:`,
          error instanceof Prisma.PrismaClientKnownRequestError
            ? error.code
            : "unknown error",
        );
      }
    }
  }

  console.log(
    `\n${apply ? "APPLIED" : "DRY RUN"} - void ${totalVoided} order(s); ` +
      `reverses gross=${totalAmount}c ($${(totalAmount / 100).toFixed(2)}), ` +
      `commission=${totalCommission}c ($${(totalCommission / 100).toFixed(2)})`,
  );
  if (!apply) {
    console.log("No changes written. Re-run with --apply to commit.");
  }
}

main()
  .catch((error) => {
    console.error("Reconciliation failed:", error);
    process.exitCode = 1;
  })
  .finally(() => {
    void prisma.$disconnect();
  });
