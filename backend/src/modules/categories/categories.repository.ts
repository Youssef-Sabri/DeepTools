import { prisma } from "../../config/database";
import { normalizeArabicText } from "../../utils/localization";
import { Category } from "@prisma/client";

export interface CategoryWithProductCount extends Category {
  _count?: {
    products: number;
  };
}

export class CategoriesRepository {
  async findAll(options?: {
    includeDeleted?: boolean;
    includeInactive?: boolean;
  }): Promise<CategoryWithProductCount[]> {
    return prisma.category.findMany({
      where: {
        ...(options?.includeDeleted ? {} : { deletedAt: null }),
        // Public catalog listings must not surface categories an admin has
        // deactivated; the admin console passes includeInactive to see them all.
        ...(options?.includeInactive ? {} : { isActive: true }),
      },
      // Admin-defined ordering first, then a stable name tiebreaker.
      orderBy: [{ displayOrder: "asc" }, { name: "asc" }],
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
    icon?: string | null;
    displayOrder?: number;
    isActive?: boolean;
  }): Promise<Category> {
    return prisma.category.create({
      data: {
        slug: data.slug,
        name: data.name,
        nameAr: data.nameAr,
        // Normalized projection for resilient Arabic search (BACKEND_RULES 16.3).
        nameArNorm: normalizeArabicText(data.nameAr),
        description: data.description,
        descriptionAr: data.descriptionAr,
        icon: data.icon ?? null,
        displayOrder: data.displayOrder ?? 0,
        isActive: data.isActive ?? true,
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
      icon?: string | null;
      displayOrder?: number;
      isActive?: boolean;
    },
  ): Promise<Category> {
    return prisma.category.update({
      where: { id },
      data: {
        ...data,
        // Keep the search projection in sync whenever the Arabic name changes.
        ...(data.nameAr !== undefined
          ? { nameArNorm: normalizeArabicText(data.nameAr) }
          : {}),
      },
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
