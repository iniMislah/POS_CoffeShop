import { z } from "zod";

export const stockInSchema = z.object({
  ingredientId: z.string().uuid(),
  qty: z.coerce.number().positive(),
  note: z.string().optional(),
});

export const stockAdjustmentSchema = z.object({
  ingredientId: z.string().uuid(),
  newStock: z.coerce.number().nonnegative(),
  note: z.string().optional(),
});
