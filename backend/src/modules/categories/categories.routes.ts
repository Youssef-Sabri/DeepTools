import { Router } from "express";
import { categoriesController } from "./categories.controller";
import {
  validateBody,
  validateQuery,
  validateParams,
} from "../../middleware/validation.middleware";
import { uuidIdParamsSchema } from "../../middleware/requestBounds";
import {
  createCategorySchema,
  updateCategorySchema,
  listCategoriesQuerySchema,
} from "./categories.validator";

// ================= Public Categories Routes ================= //
const publicRouter = Router();

publicRouter.get(
  "/",
  validateQuery(listCategoriesQuerySchema),
  categoriesController.listCategories,
);

publicRouter.get(
  "/:id",
  validateParams(uuidIdParamsSchema),
  categoriesController.getCategoryById,
);

// ================= Admin Categories Routes ================= //
// Note: router.use(authenticate) and router.use(requireRole(["ADMIN"]))
// are applied automatically by admin.routes.ts
const adminRouter = Router();

adminRouter.get(
  "/",
  validateQuery(listCategoriesQuerySchema),
  categoriesController.listCategories,
);

adminRouter.get(
  "/:id",
  validateParams(uuidIdParamsSchema),
  categoriesController.getCategoryById,
);

adminRouter.post(
  "/",
  validateBody(createCategorySchema),
  categoriesController.createCategory,
);

adminRouter.put(
  "/:id",
  validateParams(uuidIdParamsSchema),
  validateBody(updateCategorySchema),
  categoriesController.updateCategory,
);

adminRouter.delete(
  "/:id",
  validateParams(uuidIdParamsSchema),
  categoriesController.deleteCategory,
);

export {
  publicRouter as categoriesRoutes,
  adminRouter as adminCategoriesRoutes,
};
export default publicRouter;
