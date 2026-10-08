import { prisma } from '../../config/database';
import { Prisma } from '@prisma/client';

export class ProductsRepository {
  async findAll(params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    status?: string;
  }) {
    const page = params?.page || 1;
    const limit = params?.limit || 20;
    const skip = (page - 1) * limit;
    const status = params?.status || 'approved';

    const where: Prisma.ProductWhereInput = {
      ...(status !== 'all' ? { status } : {}),
      ...(params?.category ? { category: params.category } : {}),
      ...(params?.search
        ? {
            OR: [
              { name: { contains: params.search, mode: 'insensitive' } },
              { nameAr: { contains: params.search, mode: 'insensitive' } },
              { description: { contains: params.search, mode: 'insensitive' } },
              {
                descriptionAr: {
                  contains: params.search,
                  mode: 'insensitive',
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
        orderBy: { createdAt: 'desc' },
        include: {
          seller: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.product.count({ where }),
    ]);

    return { items, total };
  }

  async findById(id: string, status: string = 'approved') {
    return prisma.product.findFirst({
      where: {
        id,
        ...(status ? { status } : {}),
      },
      include: {
        seller: {
          select: {
            id: true,
            name: true,
          },
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
    status?: string;
    fileKey?: string | null;
    fileSize?: number | null;
    fileMime?: string | null;
    fileChecksum?: string | null;
    downloadUrl?: string | null;
    badge?: string | null;
    badgeAr?: string | null;
  }) {
    return prisma.product.create({
      data,
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
      downloadUrl?: string;
      badge?: string | null;
      badgeAr?: string | null;
    }>,
  ) {
    return prisma.product.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await prisma.product.delete({
      where: { id },
    });
  }

  async createLicense(data: {
    userId: string;
    productId: string;
    licenseKey: string;
    expiresAt: Date;
  }) {
    return prisma.license.create({
      data,
    });
  }

  async createPurchaseTransaction(data: {
    userId: string;
    productId: string;
    licenseKey: string;
    expiresAt: Date;
    amount: number;
    commissionPercent: number;
    commissionAmount: number;
    sellerAmount: number;
  }) {
    return prisma.$transaction(async (tx) => {
      const license = await tx.license.create({
        data: {
          userId: data.userId,
          productId: data.productId,
          licenseKey: data.licenseKey,
          expiresAt: data.expiresAt,
        },
      });

      const order = await tx.order.create({
        data: {
          userId: data.userId,
          amount: data.amount,
          commissionPercent: data.commissionPercent,
          commissionAmount: data.commissionAmount,
          sellerAmount: data.sellerAmount,
          status: 'completed',
          paymentGateway: 'stripe',
        },
      });

      return { license, order };
    });
  }

  async findUserLicenses(userId: string) {
    const list = await prisma.license.findMany({
      where: { userId },
      include: {
        product: {
          select: {
            name: true,
            nameAr: true,
            downloadUrl: true,
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
      productName: lic.product.name,
      productNameAr: lic.product.nameAr,
      downloadUrl: lic.product.downloadUrl,
    }));
  }
}

export const productsRepository = new ProductsRepository();
