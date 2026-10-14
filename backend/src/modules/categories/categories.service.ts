import {
  categoriesRepository,
  CategoriesRepository,
} from "./categories.repository";
import {
  CreateCategoryInput,
  UpdateCategoryInput,
} from "./categories.validator";
import { ApiError } from "../../utils/apiError";
import { resolveLocalizedField } from "../../utils/localization";

export interface FormattedCategory {
  id: string;
  slug: string;
  name: string;
  nameAr: string;
  displayName: string;
  description: string | null;
  descriptionAr: string | null;
  displayDescription: string | null;
  icon: string | null;
  displayOrder: number;
  isActive: boolean;
  productCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export class CategoriesService {
  constructor(
    private readonly repo: CategoriesRepository = categoriesRepository,
  ) {}

  async listCategories(
    lang: string = "en",
    includeInactive = false,
  ): Promise<FormattedCategory[]> {
    const categories = await this.repo.findAll({ includeInactive });

    return categories.map((cat) => ({
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      nameAr: cat.nameAr,
      displayName: resolveLocalizedField(cat.name, cat.nameAr, lang),
      description: cat.description,
      descriptionAr: cat.descriptionAr,
      displayDescription: resolveLocalizedField(
        cat.description,
        cat.descriptionAr,
        lang,
      ),
      icon: cat.icon,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
      productCount: cat._count?.products ?? 0,
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    }));
  }

  async getCategoryById(
    id: string,
    lang: string = "en",
  ): Promise<FormattedCategory> {
    const cat = await this.repo.findById(id);
    if (!cat || cat.deletedAt) {
      throw ApiError.notFound("Category not found");
    }

    return {
      id: cat.id,
      slug: cat.slug,
      name: cat.name,
      nameAr: cat.nameAr,
      displayName: resolveLocalizedField(cat.name, cat.nameAr, lang),
      description: cat.description,
      descriptionAr: cat.descriptionAr,
      displayDescription: resolveLocalizedField(
        cat.description,
        cat.descriptionAr,
        lang,
      ),
      icon: cat.icon,
      displayOrder: cat.displayOrder,
      isActive: cat.isActive,
      productCount: await this.repo.countActiveProducts(cat.id, cat.slug),
      createdAt: cat.createdAt,
      updatedAt: cat.updatedAt,
    };
  }

  async createCategory(input: CreateCategoryInput) {
    const slug = input.slug || generateSlug(input.name);

    if (!slug) {
      throw ApiError.badRequest(
        "Unable to generate valid slug from category name",
      );
    }

    const existing = await this.repo.findBySlug(slug);
    if (existing && !existing.deletedAt) {
      throw ApiError.conflict(`Category with slug '${slug}' already exists`);
    }

    return this.repo.create({
      slug,
      name: input.name,
      nameAr: input.nameAr,
      description: input.description,
      descriptionAr: input.descriptionAr,
      icon: input.icon,
      displayOrder: input.displayOrder,
    });
  }

  async updateCategory(id: string, input: UpdateCategoryInput) {
    const cat = await this.repo.findById(id);
    if (!cat || cat.deletedAt) {
      throw ApiError.notFound("Category not found");
    }

    if (input.slug && input.slug !== cat.slug) {
      const slugTaken = await this.repo.findBySlug(input.slug);
      if (slugTaken && slugTaken.id !== id && !slugTaken.deletedAt) {
        throw ApiError.conflict(
          `Category with slug '${input.slug}' already exists`,
        );
      }
    }

    return this.repo.update(id, {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.nameAr !== undefined ? { nameAr: input.nameAr } : {}),
      ...(input.slug !== undefined ? { slug: input.slug } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.descriptionAr !== undefined
        ? { descriptionAr: input.descriptionAr }
        : {}),
      ...(input.icon !== undefined ? { icon: input.icon } : {}),
      ...(input.displayOrder !== undefined
        ? { displayOrder: input.displayOrder }
        : {}),
      ...(input.isActive !== undefined ? { isActive: input.isActive } : {}),
    });
  }

  async deleteCategory(id: string): Promise<void> {
    const cat = await this.repo.findById(id);
    if (!cat || cat.deletedAt) {
      throw ApiError.notFound("Category not found");
    }

    const activeProducts = await this.repo.countActiveProducts(
      cat.id,
      cat.slug,
    );
    if (activeProducts > 0) {
      throw ApiError.conflict(
        "Cannot delete category with active products. Reassign or delete products first.",
      );
    }

    await this.repo.softDelete(id);
  }
}

export const categoriesService = new CategoriesService();
