import { prisma } from '../../config/database';

export class ProductsRepository {
  async findAll() {
    return prisma.product.findMany();
  }

  async findById(id: string) {
    return prisma.product.findUnique({
      where: { id },
    });
  }

  async create(data: {
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
