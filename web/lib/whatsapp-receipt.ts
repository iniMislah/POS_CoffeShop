import { API_ORIGIN, APP_BASE_URL } from "@/lib/config";
import { formatCurrency } from "@/lib/utils";

export type WhatsAppReceiptOrder = {
  invoiceNumber: string;
  totalAmount: number | string;
  receiptToken?: string | null;
  receiptUrl?: string | null;
  pdfUrl?: string | null;
  customerPhone?: string | null;
};

export function normalizeIndonesianPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");

  if (digits.startsWith("0")) {
    return `62${digits.slice(1)}`;
  }

  if (digits.startsWith("620")) {
    return `62${digits.slice(3)}`;
  }

  return digits;
}

export function isValidWhatsAppPhone(phone: string) {
  const normalized = normalizeIndonesianPhone(phone);
  return normalized.startsWith("62") && normalized.length >= 10;
}

export function getReceiptUrls(order: WhatsAppReceiptOrder) {
  const receiptUrl = order.receiptUrl || (order.receiptToken ? `${APP_BASE_URL}/receipt/${order.receiptToken}` : "");
  const pdfUrl = order.pdfUrl || (order.receiptToken ? `${API_ORIGIN}/api/receipts/${order.receiptToken}/pdf` : "");

  return { receiptUrl, pdfUrl };
}

export function buildWhatsAppReceiptMessage(order: WhatsAppReceiptOrder) {
  const { receiptUrl, pdfUrl } = getReceiptUrls(order);

  return [
    "Halo Kak, berikut receipt transaksi GALEH KOPI:",
    "",
    `Invoice: ${order.invoiceNumber}`,
    `Total: ${formatCurrency(Number(order.totalAmount))}`,
    receiptUrl ? `Receipt: ${receiptUrl}` : null,
    pdfUrl ? `Download PDF: ${pdfUrl}` : null,
    "",
    "Terima kasih sudah mampir ke GALEH KOPI.",
    "Manggaleh Raso, Manyambuang Cerito.",
  ]
    .filter(Boolean)
    .join("\n");
}

export function openWhatsAppReceipt(order: WhatsAppReceiptOrder, phone?: string | null) {
  const targetPhone = normalizeIndonesianPhone(phone || order.customerPhone || "");
  if (!isValidWhatsAppPhone(targetPhone)) {
    return false;
  }

  const message = encodeURIComponent(buildWhatsAppReceiptMessage(order));
  window.open(`https://wa.me/${targetPhone}?text=${message}`, "_blank", "noopener,noreferrer");
  return true;
}
