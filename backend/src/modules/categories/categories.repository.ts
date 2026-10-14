import { prisma } from "../../config/database";
import { Category } from "@prisma/client";

export interface CategoryWithProductCount extends Category {
  _count?: {
    products: number;
  };
}

export class CategoriesRepository {
  async findAll(options?: {
    includeDeleted?: boolean;
  }): Promise<CategoryWithProductCount[]> {
    return prisma.category.findMany({
      where: options?.includeDeleted ? {} : { deletedAt: null },
      orderBy: { createdAt: "asc" },
      include: {
        _count: {
          select: {
            products: {
              where: {
                status: "APPROVED",
                deletedAt: null,
              },
            },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { id },
    });
  }

  async findBySlug(slug: string): Promise<Category | null> {
    return prisma.category.findUnique({
      where: { slug },
    });
  }

  async create(data: {
    slug: string;
    name: string;
    nameAr: string;
    description?: string;
    descriptionAr?: string;
  }): Promise<Category> {
    return prisma.category.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameAr: data.nameAr,
        description: data.description,
        descriptionAr: data.descriptionAr,
      },
    });
  }

  async update(
    id: string,
    data: {
      slug?: string;
      name?: string;
      nameAr?: string;
      description?: string | null;
      descriptionAr?: string | null;
    },
  ): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data,
    });
  }

  async softDelete(id: string): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data: { deletedAt: new Date() },
    });
  }

  async countActiveProducts(id: string, slug?: string): Promise<number> {
    return prisma.product.count({
      where: {
        status: "APPROVED",
        deletedAt: null,
        OR: [{ categoryId: id }, ...(slug ? [{ category: slug }] : [])],
      },
    });
  }
}

export const categoriesRepository = new CategoriesRepository();
