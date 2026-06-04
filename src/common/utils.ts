import crypto from "crypto";

import { env } from "../config/env";

export const generateInvoiceNumber = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `INV-${datePart}-${timePart}-${randomPart}`;
};

export const generateReceiptToken = () => crypto.randomBytes(18).toString("hex");

type DecimalLike = number | string | { toString(): string };

export const toDecimal = (value: DecimalLike) => Number(value.toString());

export const getOrderDisplayTotal = (subtotal: DecimalLike, serviceAmount: DecimalLike) =>
  Number(subtotal.toString()) + Number(serviceAmount.toString());

export const getReceiptPublicUrl = (receiptToken: string) => {
  const fallbackBaseUrl = process.env.NODE_ENV === "production" ? undefined : `${env.APP_URL}/receipt`;
  const baseUrl = (env.RECEIPT_PUBLIC_BASE_URL ?? env.WEB_APP_URL ?? fallbackBaseUrl)?.replace(/\/$/, "");

  if (!baseUrl) {
    throw new Error("Receipt public base URL is not configured.");
  }

  return baseUrl.endsWith("/receipt") ? `${baseUrl}/${receiptToken}` : `${baseUrl}/receipt/${receiptToken}`;
};
