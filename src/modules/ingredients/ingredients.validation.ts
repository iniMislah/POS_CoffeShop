import { z } from "zod";

const ingredientFieldsSchema = z.object({
  name: z.string().min(2),
  unit: z.string().min(1),
  currentStock: z.coerce.number().nonnegative(),
  minimumStock: z.coerce.number().nonnegative(),
  costPerUnit: z.coerce.number().nonnegative(),
});

export const ingredientSchema = ingredientFieldsSchema.extend({
  note: z.string().trim().optional(),
});

export const updateIngredientSchema = ingredientFieldsSchema.partial();

export const ingredientIdParamSchema = z.object({
  id: z.string().uuid(),
});
