import dotenv from "dotenv";
import { z } from "zod";

dotenv.config();

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  PORT: z.coerce.number().default(4000),
  APP_URL: z.string().url(),
  JWT_SECRET: z.string().min(16),
  JWT_EXPIRES_IN: z.string().default("7d"),
  PAYMENT_GATEWAY_NAME: z.string().default("mock-qris"),
  PAYMENT_WEBHOOK_SECRET: z.string().min(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid environment variables: ${parsed.error.message}`);
}

export const env = parsed.data;
