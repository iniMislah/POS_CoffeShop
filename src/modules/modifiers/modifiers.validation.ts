import { z } from "zod";

export const modifierSchema = z.object({
  productId: z.string().uuid(),
  name: z.string().min(1),
  price: z.coerce.number().nonnegative(),
});

export const updateModifierSchema = modifierSchema.partial();

export const modifierIdParamSchema = z.object({
  id: z.string().uuid(),
});
