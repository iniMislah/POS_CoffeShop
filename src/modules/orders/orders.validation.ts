import { z } from "zod";

export const DEFAULT_ORDER_TAX_AMOUNT = 0;
export const DEFAULT_ORDER_SERVICE_AMOUNT = 0;

export const createDraftOrderSchema = z.object({
  customerId: z.string().uuid().optional().nullable(),
});

export const addOrderItemSchema = z.object({
  productId: z.string().uuid(),
  variantId: z.string().uuid().nullable().optional(),
  modifierIds: z.array(z.string().uuid()).default([]),
  qty: z.coerce.number().int().positive(),
  notes: z.string().nullable().optional(),
});

export const checkoutOrderSchema = z.object({
  taxAmount: z.coerce.number().nonnegative().default(DEFAULT_ORDER_TAX_AMOUNT),
  serviceAmount: z.coerce.number().nonnegative().default(DEFAULT_ORDER_SERVICE_AMOUNT),
});

export const orderIdParamSchema = z.object({
  id: z.string().uuid(),
});
