import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url(),
  WEB_APP_URL: z.string().url().optional(),
  RECEIPT_PUBLIC_BASE_URL: z.string().url().optional(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PAYMENT_GATEWAY_NAME: z.string().default("manual"),
  PAYMENT_WEBHOOK_SECRET: z.string().optional(),
  MIDTRANS_SERVER_KEY: z.string().optional(),
  MIDTRANS_CLIENT_KEY: z.string().optional(),
  MIDTRANS_IS_PRODUCTION: z.coerce.boolean().optional(),
}).superRefine((value, ctx) => {
  if (process.env.NODE_ENV !== "production") {
    return;
  }

  if (!value.RECEIPT_PUBLIC_BASE_URL && !value.WEB_APP_URL) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["RECEIPT_PUBLIC_BASE_URL"],
      message: "RECEIPT_PUBLIC_BASE_URL or WEB_APP_URL is required in production for public digital receipts.",
    });
  }
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;
