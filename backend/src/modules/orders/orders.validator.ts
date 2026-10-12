import { z } from "zod";
import { paginationFields, paginationDepthError, withinPaginationDepth } from "../../middleware/requestBounds";

export const listOrdersQuerySchema = z.object({
  page: paginationFields.page,
  limit: paginationFields.limit.default(20),
}).refine(withinPaginationDepth, paginationDepthError);

export type ListOrdersQuery = z.infer<typeof listOrdersQuerySchema>;
