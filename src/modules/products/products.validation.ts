import { z } from "zod";

const productOptionSchema = z.object({
  name: z.string().min(1),
});

export const variantSchema = productOptionSchema.extend({
  priceDelta: z.coerce.number(),
});

export const modifierInputSchema = productOptionSchema.extend({
  price: z.coerce.number().nonnegative(),
});

export const productSchema = z.object({
  categoryId: z.string().uuid(),
  name: z.string().min(2),
  basePrice: z.coerce.number().nonnegative(),
  isAvailable: z.boolean().default(true),
  imageUrl: z.string().url().nullable().optional(),
  variants: z.array(variantSchema).default([]),
  modifiers: z.array(modifierInputSchema).default([]),
});

export const updateProductSchema = productSchema.partial();

export const productIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const productVariantCreateParamSchema = z.object({
  productId: z.string().uuid(),
});

export const variantIdParamSchema = z.object({
  variantId: z.string().uuid(),
});
