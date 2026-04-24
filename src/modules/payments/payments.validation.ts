import { PaymentStatus } from "@prisma/client";
import { z } from "zod";

export const orderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

export const cashPaymentSchema = z.object({
  amountReceived: z.coerce.number().positive(),
});

export const qrisWebhookSchema = z.object({
  gatewayReference: z.string().min(1),
  status: z.nativeEnum(PaymentStatus),
  paidAt: z.coerce.date().optional(),
  secret: z.string().optional(),
});
