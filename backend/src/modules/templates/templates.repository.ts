import { prisma } from '../../config/database';

export class TemplatesRepository {
  async findAll(category?: string) {
    if (category) {
      return prisma.template.findMany({
        where: { category },
      });
    }
    return prisma.template.findMany();
  }

  async findById(id: string) {
    return prisma.template.findUnique({
      where: { id },
    });
  }

  async create(data: {
    name: string;
    nameAr?: string | null;
    description: string;
    descriptionAr?: string | null;
    category: string;
    compatibility: string[];
    price: number;
    downloadUrl?: string;
    version?: string;
  }) {
    return prisma.template.create({
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
      compatibility: string[];
      price: number;
      downloadUrl?: string;
      version?: string;
    }>,
  ) {
    return prisma.template.update({
      where: { id },
      data,
    });
  }

  async delete(id: string) {
    await prisma.template.delete({
      where: { id },
    });
  }

  async incrementDownloads(id: string) {
    await prisma.template.update({
      where: { id },
      data: {
        downloads: {
          increment: 1,
        },
      },
    });
  }
}

export const templatesRepository = new TemplatesRepository();
