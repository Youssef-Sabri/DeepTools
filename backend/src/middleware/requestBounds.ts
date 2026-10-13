import { z } from "zod";

export const paginationFields = {
  page: z.coerce.number().int().positive().max(200).default(1),
  limit: z.coerce.number().int().positive().max(100),
};

export const withinPaginationDepth = (query: {
  page: number;
  limit: number;
}): boolean => (query.page - 1) * query.limit <= 10_000;

export const paginationDepthError = {
  message: "Pagination depth cannot exceed 10,000 records",
  path: ["page"],
};

export const uuidIdParamsSchema = z.object({ id: z.string().uuid() });
