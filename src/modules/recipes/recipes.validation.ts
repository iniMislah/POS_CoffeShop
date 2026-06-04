import { z } from "zod";

export const upsertRecipeSchema = z.object({
  variantId: z.string().uuid().nullable().optional(),
  items: z.array(
    z.object({
      ingredientId: z.string().uuid(),
      qtyUsed: z.coerce.number().positive(),
    }),
  ).min(1),
});

export const productRecipeParamSchema = z.object({
  productId: z.string().uuid(),
});

export const recipeQuerySchema = z.object({
  variantId: z.string().uuid().optional(),
});
