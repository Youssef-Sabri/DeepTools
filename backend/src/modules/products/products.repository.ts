import { prisma } from "../../config/database";
import { Prisma, ProductStatus, OrderStatus } from "@prisma/client";
import { splitCommission } from "../../utils/commission";
import { normalizeArabicText } from "../../utils/localization";

const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class ProductsRepository {
  async findAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    sort?: "newest" | "priceAsc" | "priceDesc";
    status?: ProductStatus | "all";
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;
    const status = params?.status || ProductStatus.APPROVED;

    const where: Prisma.ProductWhereInput = {
      deletedAt: null,
      ...(status !== "all" ? { status: status } : {}),
      ...(status === ProductStatus.APPROVED
        ? { approvedFileKey: { not: null } }
        : {}),
      ...(params?.category
        ? {
            OR: [
              { category: params.category },
              ...(UUID_REGEX.test(params.category)
                ? [{ categoryId: params.category }]
                : []),
              { categoryRel: { slug: params.category } },
            ],
          }
        : {}),
      ...(params?.search
        ? (() => {
            const rawSearch = params.search.trim();
            const normalizedSearch = normalizeArabicText(rawSearch);
            const searchTerms = Array.from(
              new Set([rawSearch, normalizedSearch].filter(Boolean)),
            );
            const conditions: Prisma.ProductWhereInput[] = [];
            for (const term of searchTerms) {
              conditions.push(
                { name: { contains: term, mode: "insensitive" } },
                { nameAr: { contains: term, mode: "insensitive" } },
                // Normalized projections let taa marbuta / alef maqsura queries
                // (ة<->ه, ى<->ي) match the indexed stored text. Querying the raw
                // columns alone made those BACKEND_RULES 16.3 rules inoperative.
                { nameArNorm: { contains: term, mode: "insensitive" } },
                { description: { contains: term, mode: "insensitive" } },
                { descriptionAr: { contains: term, mode: "insensitive" } },
                {
                  descriptionArNorm: { contains: term, mode: "insensitive" },
                },
              );
            }
            return { OR: conditions };
          })()
        : {}),
    };

    const [items, total] = await Promise.all([
      prisma.product.findMany({
        where,
        skip,
        take: limit,
        orderBy:
          params?.sort === "priceAsc"
            ? [{ price: "asc" }, { id: "asc" }]
            : params?.sort === "priceDesc"
              ? [{ price: "desc" }, { id: "asc" }]
              : [{ createdAt: "desc" }, { id: "desc" }],
        include: {
          seller: {
            select: { id: true, name: true },
          },
          categoryRel: {
            select: { id: true, slug: true, name: true, nameAr: true },
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
        ...(status ? { status: status } : {}),
      },
      include: {
        seller: {
          select: { id: true, name: true },
        },
        categoryRel: {
          select: { id: true, slug: true, name: true, nameAr: true },
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
    return prisma.product.create({
      data: {
        ...data,
        // Maintain the normalized search projections so admin-created products
        // are as searchable as seller uploads (BACKEND_RULES.md 16.3).
        nameArNorm: data.nameAr ? normalizeArabicText(data.nameAr) : null,
        descriptionArNorm: data.descriptionAr
          ? normalizeArabicText(data.descriptionAr)
          : null,
      },
    });
  }

  async update(
    id: string,
    data: Partial<{
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
    }>,
  ) {
    return prisma.product.update({
      where: { id },
      data: {
        ...data,
        ...(data.nameAr !== undefined
          ? {
              nameArNorm: data.nameAr ? normalizeArabicText(data.nameAr) : null,
            }
          : {}),
        ...(data.descriptionAr !== undefined
          ? {
              descriptionArNorm: data.descriptionAr
                ? normalizeArabicText(data.descriptionAr)
                : null,
            }
          : {}),
      },
    });
  }

  async delete(id: string) {
    // Soft delete product record
    await prisma.product.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async findLicense(userId: string, productId: string) {
    return prisma.license.findFirst({
      where: {
        productId,
        userId,
        isActive: true,
      },
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
    try {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.order.findUnique({ where: { pendingKey } });
        if (existing) return existing;
        const product = await tx.product.findFirst({
          where: {
            id: data.productId,
            status: ProductStatus.APPROVED,
            deletedAt: null,
            approvedFileKey: { not: null },
          },
        });
        if (!product || !product.approvedFileKey) return null;
        const { commissionAmount, sellerAmount } = splitCommission(
          product.price,
          data.commissionPercent,
        );
        return tx.order.create({
          data: {
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
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      ) {
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
      productId: lic.productId,
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
