import { z } from "zod";

export const customerSchema = z.object({
  name: z.string().min(2),
  phone: z
    .string()
    .trim()
    .min(6)
    .max(20)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  email: z
    .string()
    .email()
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
  notes: z
    .string()
    .max(255)
    .optional()
    .or(z.literal(""))
    .transform((value) => value || undefined),
});

export const updateCustomerSchema = customerSchema.partial();

export const customerIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const customerQuerySchema = z.object({
  q: z.string().trim().optional(),
});
