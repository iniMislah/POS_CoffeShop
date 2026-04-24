import { z } from "zod";

export const upsertRecipeSchema = z.object({
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
