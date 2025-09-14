// product.validator.ts
import { z } from "zod";

export const productsQuerySchema = z.object({
  page: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 1))
    .refine((n) => Number.isFinite(n) && n >= 1, {
      message: "page must be >= 1",
    }),
  limit: z
    .string()
    .optional()
    .transform((v) => (v ? Number(v) : 8))
    .refine((n) => Number.isFinite(n) && n >= 1 && n <= 100, {
      message: "limit must be between 1 and 100",
    }),
  category: z.string().min(1).optional(), // category slug
  sort: z.enum(["price_asc", "price_desc", "newest"]).optional(),
  search: z.string().min(1).optional(),
});

export const slugParamSchema = z.object({
  slug: z.string().min(1),
});
