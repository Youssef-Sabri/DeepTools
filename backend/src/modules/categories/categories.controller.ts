import { Request, Response } from "express";
import { asyncHandler } from "../../utils/asyncHandler";
import { categoriesService, CategoriesService } from "./categories.service";

export class CategoriesController {
  constructor(
    private readonly service: CategoriesService = categoriesService,
  ) {}

  listCategories = asyncHandler(async (req: Request, res: Response) => {
    const lang = req.language || "en";
    const categories = await this.service.listCategories(lang);

    res.status(200).json({
      success: true,
      data: categories,
    });
  });

  getCategoryById = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const category = await this.service.getCategoryById(id, req.language);

    res.status(200).json({
      success: true,
      data: category,
    });
  });

  createCategory = asyncHandler(async (req: Request, res: Response) => {
    const category = await this.service.createCategory(req.body);

    res.status(201).json({
      success: true,
      statusCode: 201,
      message: req.t("categories.created"),
      data: category,
    });
  });

  updateCategory = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    const category = await this.service.updateCategory(id, req.body);

    res.status(200).json({
      success: true,
      message: req.t("categories.updated"),
      data: category,
    });
  });

  deleteCategory = asyncHandler(async (req: Request, res: Response) => {
    const id = req.params.id as string;
    await this.service.deleteCategory(id);

    res.status(200).json({
      success: true,
      message: req.t("categories.deleted"),
    });
  });
}

export const categoriesController = new CategoriesController();
