import { prisma } from '../../config/database';

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
}

export const adminRepository = new AdminRepository();
