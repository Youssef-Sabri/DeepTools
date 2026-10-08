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
