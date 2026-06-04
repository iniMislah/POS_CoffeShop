import PDFDocument from "pdfkit";
import QRCode from "qrcode";
import { PaymentStatus, Prisma, UserRole } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { getOrderDisplayTotal, getReceiptPublicUrl } from "../../common/utils";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";

const receiptInclude = {
  cashier: {
    select: {
      id: true,
      name: true,
    },
  },
  customer: {
    select: {
      id: true,
      name: true,
    },
  },
  orderItems: {
    include: {
      modifiers: true,
    },
  },
  paymentTransactions: {
    orderBy: {
      createdAt: "desc",
    },
  },
} satisfies Prisma.OrderInclude;

const getPaidReceiptOrderByToken = async (token: string) => {
  const order = await prisma.order.findFirst({
    where: {
      receiptToken: token,
      paymentStatus: PaymentStatus.PAID,
    },
    include: receiptInclude,
  });

  if (!order) {
    throw new AppError("Receipt not found", 404);
  }

  return order;
};

const getPaidReceiptOrderById = async (orderId: string) => {
  const order = await prisma.order.findFirst({
    where: {
      id: orderId,
      paymentStatus: PaymentStatus.PAID,
      receiptToken: {
        not: null,
      },
    },
    include: receiptInclude,
  });

  if (!order) {
    throw new AppError("Paid receipt not found for this order", 404);
  }

  return order;
};

const ensureOrderInScope = (order: { cashier: { id: string } | null }, user: Express.User) => {
  if (user.role !== UserRole.ADMIN && order.cashier?.id !== user.id) {
    throw new AppError("Forbidden", 403);
  }
};

const mapReceiptResponse = (order: Awaited<ReturnType<typeof getPaidReceiptOrderByToken>>) => {
  const latestPayment = order.paymentTransactions[0] ?? null;
  const pdfUrl = order.receiptToken ? `${env.APP_URL.replace(/\/$/, "")}/api/receipts/${order.receiptToken}/pdf` : null;

  return {
    invoiceNumber: order.invoiceNumber,
    receiptToken: order.receiptToken,
    receiptUrl: order.receiptToken ? getReceiptPublicUrl(order.receiptToken) : null,
    pdfUrl,
    paidAt: order.paidAt,
    createdAt: order.createdAt,
    subtotal: order.subtotal,
    serviceAmount: order.serviceAmount,
    totalAmount: getOrderDisplayTotal(order.subtotal, order.serviceAmount),
    paymentStatus: order.paymentStatus,
    orderStatus: order.status,
    cashier: order.cashier,
    customerName: order.customerNameSnapshot ?? order.customer?.name ?? "Walk-in Customer",
    payment: latestPayment
      ? {
          method: latestPayment.method,
          status: latestPayment.status,
          amountReceived: latestPayment.amountReceived,
          changeAmount: latestPayment.changeAmount,
          paidAt: latestPayment.paidAt,
          gatewayReference: latestPayment.gatewayReference,
        }
      : null,
    items: order.orderItems.map((item) => ({
      id: item.id,
      productNameSnapshot: item.productNameSnapshot,
      variantNameSnapshot: item.variantNameSnapshot,
      unitPrice: item.unitPrice,
      qty: item.qty,
      notes: item.notes,
      lineTotal: item.lineTotal,
      modifiers: item.modifiers.map((modifier) => ({
        id: modifier.id,
        modifierNameSnapshot: modifier.modifierNameSnapshot,
        price: modifier.price,
      })),
    })),
  };
};

const logReceiptAccess = async (orderId: string, userAgent?: string | null) => {
  await prisma.receiptAccessLog.create({
    data: {
      orderId,
      userAgent: userAgent ?? null,
    },
  });
};

const formatCurrency = (value: number | string | { toString(): string }) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(value.toString()));

const formatDateTime = (value?: Date | null) =>
  value
    ? new Intl.DateTimeFormat("id-ID", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(value)
    : "-";

const formatPaymentMethodLabel = (value?: string | null) => {
  if (value === "QRIS") {
    return "QRIS Manual";
  }

  if (value === "CASH") {
    return "Cash";
  }

  return value ?? "-";
};

const streamPdf = async (order: Awaited<ReturnType<typeof getPaidReceiptOrderByToken>>) => {
  const receiptUrl = getReceiptPublicUrl(order.receiptToken ?? "");
  const qrCodeDataUrl = order.receiptToken ? await QRCode.toDataURL(receiptUrl, { margin: 1, width: 180 }) : null;
  const doc = new PDFDocument({
    margin: 42,
    size: "A4",
    bufferPages: true,
  });

  const chunks: Buffer[] = [];
  doc.on("data", (chunk) => chunks.push(chunk));

  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)));
    doc.on("error", reject);
  });

  doc.rect(0, 0, doc.page.width, 110).fill("#5A3E2B");
  doc.fillColor("#FFFFFF").fontSize(24).font("Helvetica-Bold").text("Coffee Shop POS", 42, 36);
  doc.fontSize(11).font("Helvetica").fillColor("#EAD9C7").text("Digital Receipt", 42, 68);

  doc.roundedRect(42, 126, doc.page.width - 84, 88, 14).fill("#F7EEE3");
  doc.fillColor("#4E342E").fontSize(10).font("Helvetica-Bold");
  doc.text("Invoice Number", 58, 144);
  doc.text("Transaction Date", 250, 144);
  doc.text("Cashier", 430, 144);
  doc.font("Helvetica").fontSize(12);
  doc.text(order.invoiceNumber, 58, 162);
  doc.text(formatDateTime(order.paidAt ?? order.createdAt), 250, 162, { width: 150 });
  doc.text(order.cashier?.name ?? "-", 430, 162, { width: 110 });
  doc.text("Customer", 58, 198);
  doc.text(order.customerNameSnapshot ?? order.customer?.name ?? "Walk-in Customer", 58, 214, { width: 170 });

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#5A3E2B");
  doc.text("Payment Status", 250, 198);
  doc.text("Payment Method", 430, 198);
  doc.font("Helvetica").fillColor("#4E342E");
  doc.text(order.paymentStatus, 250, 214);
  doc.text(formatPaymentMethodLabel(order.paymentTransactions[0]?.method), 430, 214);

  let y = 244;
  doc.fillColor("#5A3E2B").font("Helvetica-Bold").fontSize(13).text("Order Items", 42, y);
  y += 24;

  doc.roundedRect(42, y, doc.page.width - 84, 26, 8).fill("#6F4E37");
  doc.fillColor("#FFFFFF").font("Helvetica-Bold").fontSize(10);
  doc.text("Item", 56, y + 8);
  doc.text("Qty", 290, y + 8, { width: 40, align: "center" });
  doc.text("Price", 340, y + 8, { width: 90, align: "right" });
  doc.text("Total", 438, y + 8, { width: 104, align: "right" });
  y += 36;

  doc.font("Helvetica").fillColor("#4E342E");
  order.orderItems.forEach((item) => {
    const itemName = item.variantNameSnapshot
      ? `${item.productNameSnapshot} - ${item.variantNameSnapshot}`
      : item.productNameSnapshot;
    const itemHeight = 26 + item.modifiers.length * 14 + (item.notes ? 14 : 0);

    if (y + itemHeight > doc.page.height - 180) {
      doc.addPage();
      y = 56;
    }

    doc.text(itemName, 56, y, { width: 220 });
    doc.text(String(item.qty), 290, y, { width: 40, align: "center" });
    doc.text(formatCurrency(item.unitPrice), 340, y, { width: 90, align: "right" });
    doc.text(formatCurrency(item.lineTotal), 438, y, { width: 104, align: "right" });
    y += 18;

    item.modifiers.forEach((modifier) => {
      doc.fillColor("#8D6E63").fontSize(9).text(`+ ${modifier.modifierNameSnapshot}`, 72, y, { width: 240 });
      doc.text(formatCurrency(modifier.price), 438, y, { width: 104, align: "right" });
      y += 14;
    });

    if (item.notes) {
      doc.fillColor("#A1887F").fontSize(9).text(`Note: ${item.notes}`, 72, y, { width: 240 });
      y += 14;
    }

    doc.moveTo(56, y + 2).lineTo(542, y + 2).strokeColor("#EAD9C7").stroke();
    doc.fillColor("#4E342E").fontSize(10);
    y += 12;
  });

  const summaryBoxY = Math.max(y + 12, doc.page.height - 170);
  doc.roundedRect(320, summaryBoxY, 222, 92, 14).fill("#F7EEE3");
  doc.fillColor("#4E342E").font("Helvetica").fontSize(11);
  doc.text("Subtotal", 338, summaryBoxY + 18);
  doc.text(formatCurrency(order.subtotal), 430, summaryBoxY + 18, { width: 94, align: "right" });

  if (Number(order.serviceAmount) > 0) {
    doc.text("Service", 338, summaryBoxY + 40);
    doc.text(formatCurrency(order.serviceAmount), 430, summaryBoxY + 40, { width: 94, align: "right" });
  }

  doc.font("Helvetica-Bold").fontSize(12).text("Total", 338, summaryBoxY + 62);
  doc.text(formatCurrency(getOrderDisplayTotal(order.subtotal, order.serviceAmount)), 430, summaryBoxY + 62, {
    width: 94,
    align: "right",
  });

  const latestPayment = order.paymentTransactions[0];
  if (latestPayment?.amountReceived) {
    doc.font("Helvetica").fontSize(10).fillColor("#4E342E");
    doc.text(`Amount Received: ${formatCurrency(latestPayment.amountReceived)}`, 42, summaryBoxY + 12);
  }

  if (latestPayment?.changeAmount) {
    doc.text(`Change: ${formatCurrency(latestPayment.changeAmount)}`, 42, summaryBoxY + 30);
  }

  if (qrCodeDataUrl) {
    doc.image(qrCodeDataUrl, 42, summaryBoxY + 42, { width: 76, height: 76 });
  }

  doc.fontSize(10).font("Helvetica-Bold").fillColor("#5A3E2B").text("Thank you for your purchase", 132, summaryBoxY + 48);
  doc.font("Helvetica").fillColor("#7A5C49").text("Scan QR / save this receipt for your records", 132, summaryBoxY + 66);

  doc.end();
  return finished;
};

export const receiptsService = {
  async getPublicReceipt(token: string, userAgent?: string | null) {
    const order = await getPaidReceiptOrderByToken(token);
    await logReceiptAccess(order.id, userAgent);
    return mapReceiptResponse(order);
  },

  async getReceiptQr(orderId: string, user: Express.User) {
    const order = await getPaidReceiptOrderById(orderId);
    ensureOrderInScope(order, user);
    const receiptUrl = getReceiptPublicUrl(order.receiptToken ?? "");

    return {
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      receiptToken: order.receiptToken,
      receiptUrl,
      pdfUrl: `${env.APP_URL.replace(/\/$/, "")}/api/receipts/${order.receiptToken}/pdf`,
      qrCodeDataUrl: await QRCode.toDataURL(receiptUrl, {
        margin: 1,
        width: 280,
        color: {
          dark: "#5A3E2B",
          light: "#FFFDF9",
        },
      }),
    };
  },

  async getReceiptPdf(token: string, userAgent?: string | null) {
    const order = await getPaidReceiptOrderByToken(token);
    await logReceiptAccess(order.id, userAgent);
    return {
      fileName: `${order.invoiceNumber.toLowerCase()}.pdf`,
      buffer: await streamPdf(order),
    };
  },
};
