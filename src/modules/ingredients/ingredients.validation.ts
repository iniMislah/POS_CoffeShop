import { z } from "zod";

export const ingredientSchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(1),
  currentStock: z.coerce.number().nonnegative(),
  minimumStock: z.coerce.number().nonnegative(),
  costPerUnit: z.coerce.number().nonnegative(),
});

export const updateIngredientSchema = ingredientSchema.partial();

export const ingredientIdParamSchema = z.object({
  id: z.string().uuid(),
});
