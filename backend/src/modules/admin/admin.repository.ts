import { prisma } from "../../config/database";

export class AdminRepository {
  async findAllUsers() {
    return prisma.user.findMany({
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
      },
    });
  }

  async findUserById(id: string) {
    return prisma.user.findUnique({
      where: { id },
    });
  }

  async deleteUser(id: string) {
    await prisma.user.delete({
      where: { id },
    });
  }

  async findAllLicenses() {
    const list = await prisma.license.findMany({
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
        product: {
          select: {
            name: true,
            nameAr: true,
          },
        },
      },
    });

    return list.map((lic) => ({
      id: lic.id,
      licenseKey: lic.licenseKey,
      isActive: lic.isActive,
      expiresAt: lic.expiresAt,
      createdAt: lic.createdAt,
      userName: lic.user.name,
      userEmail: lic.user.email,
      productName: lic.product.name,
      productNameAr: lic.product.nameAr,
    }));
  }

  async findLicenseById(id: string) {
    return prisma.license.findUnique({
      where: { id },
    });
  }

  async updateLicenseStatus(id: string, isActive: boolean) {
    return prisma.license.update({
      where: { id },
      data: { isActive },
    });
  }

  async findAllUploads(params: {
    page: number;
    limit: number;
    status?: string;
  }) {
    const skip = (params.page - 1) * params.limit;
    const where = params.status ? { status: params.status } : {};

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: params.limit,
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findUploadById(id: string) {
    return prisma.product.findUnique({
      where: { id },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  async updateUploadReview(
    id: string,
    data: {
      status: string;
      rejectionNote: string | null;
      reviewedAt: Date;
    },
  ) {
    return prisma.product.update({
      where: { id },
      data: {
        status: data.status,
        rejectionNote: data.rejectionNote,
        reviewedAt: data.reviewedAt,
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });
  }

  /**
   * Aggregate marketplace-wide insights across uploads, orders, revenue, sellers, and top products
   */
  async getMarketplaceInsights() {
    const [
      totalUploads,
      pendingUploads,
      approvedUploads,
      rejectedUploads,
      orderAggregates,
      totalOrders,
      distinctSellers,
      topProductOrders,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "pending" } }),
      prisma.product.count({ where: { status: "approved" } }),
      prisma.product.count({ where: { status: "rejected" } }),
      prisma.order.aggregate({
        _sum: {
          amount: true,
          commissionAmount: true,
          sellerAmount: true,
        },
      }),
      prisma.order.count(),
      prisma.product.groupBy({
        by: ["sellerId"],
      }),
      prisma.order.groupBy({
        by: ["productId"],
        where: {
          productId: { not: null },
        },
        _count: {
          id: true,
        },
        orderBy: {
          _count: {
            id: "desc",
          },
        },
        take: 10,
      }),
    ]);

    const productIds = topProductOrders
      .map((t) => t.productId)
      .filter((id): id is string => Boolean(id));

    const products =
      productIds.length > 0
        ? await prisma.product.findMany({
            where: { id: { in: productIds } },
            select: { id: true, name: true },
          })
        : [];

    const productMap = new Map(products.map((p) => [p.id, p.name]));

    const topProducts = topProductOrders.map((t) => ({
      productId: t.productId ?? "",
      productName: productMap.get(t.productId ?? "") ?? "Unknown Product",
      salesCount: t._count.id,
    }));

    return {
      uploads: {
        total: totalUploads,
        pending: pendingUploads,
        approved: approvedUploads,
        rejected: rejectedUploads,
      },
      orders: {
        total: totalOrders,
        totalRevenue: orderAggregates._sum.amount ?? 0,
        totalCommission: orderAggregates._sum.commissionAmount ?? 0,
        totalSellerPayouts: orderAggregates._sum.sellerAmount ?? 0,
      },
      sellers: {
        total: distinctSellers.length,
      },
      topProducts,
    };
  }
}

export const adminRepository = new AdminRepository();
