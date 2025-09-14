import { prisma } from "../../db/prisma.js";
import { Prisma } from "@prisma/client";

/**
 * Fetch paged products with images and rating aggregates.
 * Returns { ok: true, data, meta } or { ok: false, status, error }
 */
export async function fetchProducts({
  page = 1,
  limit = 8,
  categorySlug,
  sort,
  search,
}: {
  page?: number;
  limit?: number;
  categorySlug?: string | null;
  sort?: string | null;
  search?: string | null;
}) {
  try {
    const take = limit;
    const skip = (page - 1) * take;

    const where: any = { active: true };
    if (categorySlug) where.category = { name: categorySlug };
    if (search) {
      where.OR = [
        { name: { contains: search, mode: "insensitive" } },
        { description: { contains: search, mode: "insensitive" } },
      ];
    }

    let orderBy: any = { createdAt: "desc" };
    if (sort === "price_asc") orderBy = { price: "asc" };
    if (sort === "price_desc") orderBy = { price: "desc" };
    if (sort === "newest") orderBy = { createdAt: "desc" };

    const products = await prisma.product.findMany({
      where,
      orderBy,
      skip,
      take,
      include: {
        images: { orderBy: { order: "asc" } },
        _count: { select: { ratings: true } },
      },
    });
    const productIds = products.map((p) => p.id);

    // Use the correct return type from Prisma
    let ratingAgg: Awaited<ReturnType<typeof prisma.rating.groupBy>> = [];

    if (productIds.length) {
      ratingAgg = await prisma.rating.groupBy({
        by: ["productId"],
        where: { productId: { in: productIds } },
        _avg: { value: true },
        _count: { _all: true },
      });
    }

    const ratingMap = new Map<number, { avg: number | null; count: number }>();
    for (const r of ratingAgg) {
      ratingMap.set(r.productId, {
        avg: r._avg.value !== null ? Number(r._avg.value) : null,
        count: r._count._all,
      });
    }

    const total = await prisma.product.count({ where });

    const data = products.map((p) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      description: p.description,
      price: p.price.toString(), // Decimal -> string
      images: p.images.map((img) => ({
        id: img.id,
        url: img.url,
        alt: img.alt,
        order: img.order,
      })),
      ratingCount: p._count?.ratings ?? ratingMap.get(p.id)?.count ?? 0,
      averageRating: ratingMap.get(p.id)?.avg ?? null,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    }));

    return {
      ok: true,
      data,
      meta: {
        page,
        limit: take,
        total,
        totalPages: Math.ceil(total / take),
      },
    } as const;
  } catch (error) {
    console.error("fetchProducts error:", error);
    return {
      ok: false,
      status: 500,
      error: "Failed to fetch products",
    } as const;
  }
}

/** Fetch single product by slug (with images and ratings list + aggregates) */
export async function fetchProductBySlug(slug: string) {
  try {
    const product = await prisma.product.findUnique({
      where: { slug },
      include: {
        images: { orderBy: { order: "asc" } },
        ratings: { orderBy: { createdAt: "desc" } },
      },
    });

    if (!product)
      return { ok: false, status: 404, error: "Product not found" } as const;

    const agg = await prisma.rating.aggregate({
      where: { productId: product.id },
      _avg: { value: true },
      _count: { _all: true },
    });

    const result = {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      price: product.price.toString(),
      images: product.images.map((i) => ({
        id: i.id,
        url: i.url,
        alt: i.alt,
        order: i.order,
      })),
      ratings: product.ratings.map((r) => ({
        id: r.id,
        userId: r.userId,
        value: r.value.toString(),
        comment: r.comment,
        createdAt: r.createdAt,
      })),
      averageRating: agg._avg.value !== null ? Number(agg._avg.value) : null,
      ratingCount: agg._count._all,
      createdAt: product.createdAt,
      updatedAt: product.updatedAt,
    };

    return { ok: true, product: result } as const;
  } catch (error) {
    console.error("fetchProductBySlug error:", error);
    return {
      ok: false,
      status: 500,
      error: "Failed to fetch product",
    } as const;
  }
}

/** Fetch categories with product counts */
export async function fetchCategories() {
  try {
    const cats = await prisma.category.findMany({
      orderBy: { name: "asc" },
      include: { _count: { select: { products: true } } },
    });

    const data = cats.map((c) => ({
      id: c.id,
      name: c.name,
      slug: c.slug,
      productCount: c._count.products,
    }));
    return { ok: true, data } as const;
  } catch (error) {
    console.error("fetchCategories error:", error);
    return {
      ok: false,
      status: 500,
      error: "Failed to fetch categories",
    } as const;
  }
}
