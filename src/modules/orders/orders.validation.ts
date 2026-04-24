import { z } from "zod";

export const createDraftOrderSchema = z.object({
  cashierId: z.string().uuid().optional(),
});

export const addOrderItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  modifierIds: z.array(z.string().uuid()).default([]),
  qty: z.coerce.number().int().positive(),
  notes: z.string().nullable().optional(),
});

export const checkoutOrderSchema = z.object({
  taxAmount: z.coerce.number().nonnegative().default(0),
  serviceAmount: z.coerce.number().nonnegative().default(0),
});

export const orderIdParamSchema = z.object({
  id: z.string().uuid(),
});
