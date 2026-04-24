import { z } from "zod";

export const productSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2),
  basePrice: z.coerce.number().nonnegative(),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().nullable().optional(),
});

export const updateProductSchema = productSchema.partial();

export const variantSchema = z.object({
  name: z.string().min(1),
  priceDelta: z.coerce.number(),
});

export const productIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const productVariantParamSchema = z.object({
  id: z.string().uuid(),
  productId: z.string().uuid().optional(),
  variantId: z.string().uuid().optional(),
});
