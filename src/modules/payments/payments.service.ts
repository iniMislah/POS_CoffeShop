import { OrderStatus, PaymentMethod, PaymentStatus } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { generateReceiptToken } from "../../common/utils";
import { env } from "../../config/env";
import { prisma } from "../../lib/prisma";
import { inventoryService } from "../inventory/inventory.service";
import { MockQrisProvider } from "./mock-qris.provider";

const qrisProvider = new MockQrisProvider();
const MOCK_QRIS_AUTO_PAY_MS = 15000;

const finalizePaidOrder = async (orderId: string, paidAt: Date) => {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const updatedOrder = await tx.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt,
        receiptToken: order.receiptToken ?? generateReceiptToken(),
      },
    });

    await inventoryService.deductIngredientsForPaidOrderTx(tx, orderId);

    return updatedOrder;
  });
};

export const paymentsService = {
  async listTransactions() {
    return prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        order: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            status: true,
            paymentStatus: true,
            receiptToken: true,
          },
        },
      },
    });
  },

  async payCash(orderId: string, payload: { amountReceived: number }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError("Cancelled order cannot be paid", 400);
    }

    if (order.status === OrderStatus.PAID) {
      throw new AppError("Order already paid", 400);
    }

    if (order.status === OrderStatus.DRAFT) {
      throw new AppError("Checkout order before payment", 400);
    }

    const totalAmount = Number(order.totalAmount);

    if (payload.amountReceived < totalAmount) {
      throw new AppError("Amount received is insufficient", 400);
    }

    const changeAmount = payload.amountReceived - totalAmount;
    const paidAt = new Date();

    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId,
        method: PaymentMethod.CASH,
        status: PaymentStatus.PAID,
        amount: totalAmount,
        amountReceived: payload.amountReceived,
        changeAmount,
        paidAt,
        rawResponse: {
          type: "cash",
        },
      },
    });

    const updatedOrder = await finalizePaidOrder(orderId, paidAt);

    return {
      transaction,
      order: updatedOrder,
      receiptUrl: `${env.APP_URL}/api/receipts/public/${updatedOrder.receiptToken}`,
    };
  },

  async createQrisPayment(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    if (order.status === OrderStatus.CANCELLED) {
      throw new AppError("Cancelled order cannot be paid", 400);
    }

    if (order.status === OrderStatus.PAID) {
      throw new AppError("Order already paid", 400);
    }

    if (order.status === OrderStatus.DRAFT) {
      throw new AppError("Checkout order before payment", 400);
    }

    const qrisPayment = await qrisProvider.createQrPayment({
      orderId,
      amount: Number(order.totalAmount),
      invoiceNumber: order.invoiceNumber,
    });

    const transaction = await prisma.paymentTransaction.create({
      data: {
        orderId,
        method: PaymentMethod.QRIS,
        status: PaymentStatus.PENDING,
        amount: order.totalAmount,
        gatewayProvider: qrisPayment.provider,
        gatewayReference: qrisPayment.gatewayReference,
        qrString: qrisPayment.qrString,
        expiredAt: qrisPayment.expiredAt,
        rawResponse: {
          mock: true,
        },
      },
    });

    return {
      transaction,
      qrString: qrisPayment.qrString,
      gatewayReference: qrisPayment.gatewayReference,
      expiredAt: qrisPayment.expiredAt,
    };
  },

  async handleQrisWebhook(payload: { gatewayReference: string; status: PaymentStatus; paidAt?: Date; secret?: string }) {
    if (payload.secret && payload.secret !== env.PAYMENT_WEBHOOK_SECRET) {
      throw new AppError("Invalid webhook secret", 401);
    }

    const transaction = await prisma.paymentTransaction.findFirst({
      where: {
        gatewayReference: payload.gatewayReference,
      },
      include: {
        order: true,
      },
    });

    if (!transaction) {
      throw new AppError("Payment transaction not found", 404);
    }

    const updatedTransaction = await prisma.paymentTransaction.update({
      where: { id: transaction.id },
      data: {
        status: payload.status,
        paidAt: payload.status === PaymentStatus.PAID ? payload.paidAt ?? new Date() : null,
      },
    });

    if (payload.status === PaymentStatus.PAID) {
      const updatedOrder = await finalizePaidOrder(transaction.orderId, payload.paidAt ?? new Date());

      return {
        transaction: updatedTransaction,
        order: updatedOrder,
        receiptUrl: `${env.APP_URL}/api/receipts/public/${updatedOrder.receiptToken}`,
      };
    }

    await prisma.order.update({
      where: { id: transaction.orderId },
      data: {
        paymentStatus: payload.status,
      },
    });

    return {
      transaction: updatedTransaction,
    };
  },

  async getOrderPaymentStatus(orderId: string) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentTransactions: {
          orderBy: {
            createdAt: "desc",
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    const latestTransaction = order.paymentTransactions[0] ?? null;

    if (!latestTransaction) {
      return {
        order,
        payment: null,
      };
    }

    if (
      latestTransaction.method === PaymentMethod.QRIS &&
      latestTransaction.status === PaymentStatus.PENDING
    ) {
      const now = new Date();
      const expiredAt = latestTransaction.expiredAt;
      const createdAt = latestTransaction.createdAt;
      const isExpired = expiredAt ? expiredAt <= now : false;
      const shouldAutoPay =
        !isExpired &&
        now.getTime() - createdAt.getTime() >= MOCK_QRIS_AUTO_PAY_MS;

      if (isExpired) {
        const expiredTransaction = await prisma.paymentTransaction.update({
          where: { id: latestTransaction.id },
          data: {
            status: PaymentStatus.EXPIRED,
          },
        });

        const expiredOrder = await prisma.order.update({
          where: { id: orderId },
          data: {
            paymentStatus: PaymentStatus.EXPIRED,
          },
          include: {
            paymentTransactions: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        });

        return {
          order: expiredOrder,
          payment: expiredTransaction,
        };
      }

      if (shouldAutoPay) {
        await prisma.paymentTransaction.update({
          where: { id: latestTransaction.id },
          data: {
            status: PaymentStatus.PAID,
            paidAt: now,
          },
        });

        const paidOrder = await finalizePaidOrder(orderId, now);
        const refreshedOrder = await prisma.order.findUniqueOrThrow({
          where: { id: orderId },
          include: {
            paymentTransactions: {
              orderBy: {
                createdAt: "desc",
              },
            },
          },
        });

        return {
          order: refreshedOrder,
          payment: refreshedOrder.paymentTransactions[0] ?? null,
          receiptUrl: `${env.APP_URL}/api/receipts/public/${paidOrder.receiptToken}`,
        };
      }
    }

    return {
      order,
      payment: latestTransaction,
      receiptUrl: order.receiptToken ? `${env.APP_URL}/api/receipts/public/${order.receiptToken}` : null,
    };
  },
};
