import { prisma } from "../../config/database";
import { Prisma, ProductStatus, OrderStatus } from "@prisma/client";
import { splitCommission } from "../../utils/commission";

export class ProductsRepository {
  async findAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: ProductStatus | "all";
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;
    const status = params?.status || ProductStatus.APPROVED;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(status !== "all" ? { status: status as ProductStatus } : {}),
      ...(params?.category ? { category: params.category } : {}),
      ...(params?.search
        ? {
          OR: [
            { name: { contains: params.search, mode: "insensitive" } },
            { nameAr: { contains: params.search, mode: "insensitive" } },
            { description: { contains: params.search, mode: "insensitive" } },
            {
              descriptionAr: {
                contains: params.search,
                mode: "insensitive",
              },
            },
          ],
        }
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
        include: {
          seller: {
            select: { id: true, name: true },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, status?: ProductStatus | "") {
    return prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
        ...(status ? { status: status as ProductStatus } : {}),
      },
      include: {
        seller: {
          select: { id: true, name: true },
        },
      },
    });
  }

  async create(data: {
    sellerId: string;
    name: string;
    nameAr?: string | null;
    description: string;
    descriptionAr?: string | null;
    category: string;
    price: number;
    version?: string;
    status?: ProductStatus;
    fileKey?: string | null;
    fileSize?: number | null;
    fileMime?: string | null;
    fileChecksum?: string | null;
    badge?: string | null;
    badgeAr?: string | null;
  }) {
    return prisma.product.create({ data });
  }

  async update(id: string, data: Partial<{
    name: string;
    nameAr?: string | null;
    description: string;
    descriptionAr?: string | null;
    category: string;
    price: number;
    version?: string;
    fileKey?: string;
    badge?: string | null;
    badgeAr?: string | null;
    status?: ProductStatus;
  }>) {
    return prisma.product.update({ where: { id }, data });
  }

  async delete(id: string) {
    // التعديل: تحويل الحذف النهائي لحذف وهمي
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
  }

  async findLicense(userId: string, productId: string) {
    return prisma.license.findFirst({
      where: { userId, productId },
      include: { product: true },
    });
  }

  async createPendingOrder(data: {
    userId: string;
    productId: string;
    commissionPercent: number;
    gateway: string;
    currency: string;
  }) {
    const pendingKey = `${data.userId}:${data.productId}`;
    try { return await prisma.$transaction(async (tx) => {
      const existing = await tx.order.findUnique({ where: { pendingKey } });
      if (existing) return existing;
      const product = await tx.product.findFirst({
        where: { id: data.productId, status: ProductStatus.APPROVED, deletedAt: null, approvedFileKey: { not: null } },
      });
      if (!product || !product.approvedFileKey) return null;
      const { commissionAmount, sellerAmount } = splitCommission(product.price, data.commissionPercent);
      return tx.order.create({ data: {
        userId: data.userId,
        productId: product.id,
        sellerId: product.sellerId,
        productName: product.name,
        fileKey: product.approvedFileKey,
        fileMime: product.approvedFileMime,
        pendingKey,
        amount: product.price,
        commissionPercent: data.commissionPercent,
        commissionAmount,
        sellerAmount,
        status: OrderStatus.PENDING,
        paymentGateway: data.gateway,
        currency: data.currency,
      } });
    }); } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        return prisma.order.findUnique({ where: { pendingKey } });
      }
      throw error;
    }
  }

  async findUserLicenses(userId: string) {
    const list = await prisma.license.findMany({
      where: { userId },
      include: {
        product: {
          select: { name: true, nameAr: true },
        },
      },
    });

    return list.map((lic) => ({
      id: lic.id,
      licenseKey: lic.licenseKey,
      isActive: lic.isActive,
      expiresAt: lic.expiresAt,
      createdAt: lic.createdAt,
      productName: lic.product.name,
      productNameAr: lic.product.nameAr,
    }));
  }
}

export const productsRepository = new ProductsRepository();
