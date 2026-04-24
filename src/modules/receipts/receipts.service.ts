import { PaymentStatus } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const receiptsService = {
  async getPublicReceipt(token: string, userAgent?: string | null) {
    const order = await prisma.order.findFirst({
      where: {
        receiptToken: token,
        paymentStatus: PaymentStatus.PAID,
      },
      include: {
        cashier: {
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
      },
    });

    if (!order) {
      throw new AppError("Receipt not found", 404);
    }

    await prisma.receiptAccessLog.create({
      data: {
        orderId: order.id,
        userAgent: userAgent ?? null,
      },
    });

    return {
      orderId: order.id,
      invoiceNumber: order.invoiceNumber,
      paidAt: order.paidAt,
      subtotal: order.subtotal,
      taxAmount: order.taxAmount,
      serviceAmount: order.serviceAmount,
      totalAmount: order.totalAmount,
      cashier: order.cashier,
      items: order.orderItems,
      payments: order.paymentTransactions,
    };
  },
};
