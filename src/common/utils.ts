import crypto from "crypto";

export const generateInvoiceNumber = () => {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, "0")}${String(now.getDate()).padStart(2, "0")}`;
  const timePart = `${String(now.getHours()).padStart(2, "0")}${String(now.getMinutes()).padStart(2, "0")}${String(now.getSeconds()).padStart(2, "0")}`;
  const randomPart = crypto.randomBytes(2).toString("hex").toUpperCase();

  return `INV-${datePart}-${timePart}-${randomPart}`;
};

export const generateReceiptToken = () => crypto.randomBytes(18).toString("hex");

export const toDecimal = (value: number | string) => Number(value);
