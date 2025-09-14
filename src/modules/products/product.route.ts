// product.route.ts
import { Router } from "express";
import { ZodType } from "zod";
import type { Request, Response, NextFunction } from "express";
import { productsQuerySchema, slugParamSchema } from "./product.validator.js";
import {
  fetchProducts,
  fetchProductBySlug,
  fetchCategories,
} from "./product.service.js";

export const productRouter = Router();

function parse<T>(
  schema: { safeParse: (x: unknown) => any },
  data: unknown,
  res: Response
): T | undefined {
  const r = schema.safeParse(data);
  if (!r.success) {
    res.status(400).json({
      error: "Validation failed",
      details: r.error.flatten(),
    });
    return;
  }
  return r.data as T;
}

/**
 * GET /api/products?page=1&limit=8&category=slug&sort=price_asc&search=text
 */
productRouter.get(
  "/products",
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = parse<{
      page: number;
      limit: number;
      category: string;
      sort: string;
      search: string;
    }>(productsQuerySchema, req.body, res);
    // const body = parse(productsQuerySchema, req.query, res);
    if (!body) return;

    console.log("Query:", req.query, "Parsed:", body);
    const result = await fetchProducts({
      page: body.page,
      limit: body.limit,
      categorySlug: body.category ?? undefined,
      sort: body.sort ?? undefined,
      search: body.search ?? undefined,
    });
    if (!result.ok)
      return res.status(result.status).json({ error: result.error });

    // success response format similar to your auth endpoints
    res.json({ success: true, products: result.data, meta: result.meta });
  }
);

/**
 * GET /api/products/:slug
 */
productRouter.get(
  "/products/:slug",
  async (req: Request, res: Response, _next: NextFunction) => {
    const body = parse<{
      slug: string;
    }>(productsQuerySchema, req.params, res);
    if (!body) return;

    const result = await fetchProductBySlug(body.slug);
    if (!result.ok)
      return res.status(result.status).json({ error: result.error });

    res.json({ success: true, product: result.product });
  }
);

/**
 * GET /api/categories
 */
productRouter.get(
  "/categories",
  async (_req: Request, res: Response, _next: NextFunction) => {
    const result = await fetchCategories();
    if (!result.ok)
      return res.status(result.status).json({ error: result.error });
    res.json({ success: true, categories: result.data });
  }
);

/**
 * GET /api/categories/:slug/products
 * shorthand to fetch products for a category (page/limit supported)
 */
productRouter.get(
  "/categories/:slug/products",
  async (req: Request, res: Response, _next: NextFunction) => {
    // reuse productsQuerySchema but inject category from params
    const query = parse<{
      page: number;
      limit: number;
      category: string;
      sort: string;
      search: string;
    }>(productsQuerySchema, req.body, res);
    if (!query) return;

    const slug = req.params.slug;
    const result = await fetchProducts({
      page: query.page,
      limit: query.limit,
      categorySlug: slug,
      sort: query.sort ?? undefined,
      search: query.search ?? undefined,
    });

    if (!result.ok)
      return res.status(result.status).json({ error: result.error });
    res.json({ success: true, products: result.data, meta: result.meta });
  }
);

export default productRouter;
