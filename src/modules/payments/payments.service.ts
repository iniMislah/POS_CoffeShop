import { OrderStatus, PaymentMethod, PaymentStatus, Prisma, UserRole } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { generateReceiptToken, getReceiptPublicUrl } from "../../common/utils";
import { prisma } from "../../lib/prisma";
import { inventoryService } from "../inventory/inventory.service";

type RequestUser = {
  id: string;
  role: UserRole;
};

type PaginationInput = {
  page: number;
  limit: number;
};

const ensureOrderReadyForPayment = (status: OrderStatus) => {
  if (status === OrderStatus.CANCELLED) {
    throw new AppError("Cancelled order cannot be paid", 400);
  }

  if (status === OrderStatus.PAID) {
    throw new AppError("Order already paid", 400);
  }

  if (status === OrderStatus.DRAFT) {
    throw new AppError("Checkout order before payment", 400);
  }
};

const ensureOrderInScope = (order: { cashierId: string }, user: RequestUser) => {
  if (user.role !== UserRole.ADMIN && order.cashierId !== user.id) {
    throw new AppError("Forbidden", 403);
  }
};

const orderScopeWhere = (user: RequestUser) =>
  user.role === UserRole.ADMIN
    ? {}
    : {
        cashierId: user.id,
      };

const finalizePaidOrderTx = async (tx: Prisma.TransactionClient, orderId: string, paidAt: Date) => {
  const order = await tx.order.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.status === OrderStatus.PAID && order.stockDeductedAt) {
    return order;
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
};

const getOrderWithLatestPayment = (orderId: string) =>
  prisma.order.findUnique({
    where: { id: orderId },
    include: {
      cashier: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      customer: {
        select: {
          id: true,
          name: true,
          phone: true,
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

export const paymentsService = {
  async listTransactions(user: RequestUser, pagination: PaginationInput) {
    return prisma.paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      skip: (pagination.page - 1) * pagination.limit,
      take: pagination.limit,
      where: user.role === UserRole.ADMIN ? undefined : { order: orderScopeWhere(user) },
      include: {
        order: {
          select: {
            id: true,
            invoiceNumber: true,
            totalAmount: true,
            subtotal: true,
            serviceAmount: true,
            status: true,
            paymentStatus: true,
            receiptToken: true,
            customerNameSnapshot: true,
          },
        },
      },
    });
  },

  async payCash(orderId: string, payload: { amountReceived: number }, user: RequestUser) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentTransactions: {
          where: {
            status: PaymentStatus.PAID,
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    ensureOrderInScope(order, user);

    ensureOrderReadyForPayment(order.status);

    if (order.paymentTransactions.length > 0) {
      throw new AppError("This order already has a paid transaction.", 409);
    }

    const totalAmount = Number(order.totalAmount);
    if (payload.amountReceived < totalAmount) {
      throw new AppError("Amount received is insufficient", 400);
    }

    const changeAmount = payload.amountReceived - totalAmount;
    const paidAt = new Date();

    const { transaction, updatedOrder } = await prisma.$transaction(async (tx) => {
      const transaction = await tx.paymentTransaction.create({
        data: {
          orderId,
          method: PaymentMethod.CASH,
          status: PaymentStatus.PAID,
          amount: totalAmount,
          grossAmount: totalAmount,
          amountReceived: payload.amountReceived,
          changeAmount,
          paidAt,
          gatewayProvider: "cash",
          transactionId: `cash-${order.invoiceNumber}`,
        },
      });

      const updatedOrder = await finalizePaidOrderTx(tx, orderId, paidAt);

      return { transaction, updatedOrder };
    });

    return {
      transaction,
      order: await getOrderWithLatestPayment(updatedOrder.id),
      receiptUrl: updatedOrder.receiptToken ? getReceiptPublicUrl(updatedOrder.receiptToken) : null,
    };
  },

  async payManualQris(orderId: string, payload: { gatewayReference?: string }, user: RequestUser) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        paymentTransactions: {
          where: {
            status: PaymentStatus.PAID,
          },
        },
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    ensureOrderInScope(order, user);

    ensureOrderReadyForPayment(order.status);

    if (order.paymentTransactions.length > 0) {
      throw new AppError("This order already has a paid transaction.", 409);
    }

    const paidAt = new Date();
    const { transaction, updatedOrder } = await prisma.$transaction(async (tx) => {
      // Manual external QRIS: PAID means the cashier has confirmed the payment, not gateway auto-verification.
      const transaction = await tx.paymentTransaction.create({
        data: {
          orderId,
          method: PaymentMethod.QRIS,
          status: PaymentStatus.PAID,
          amount: order.totalAmount,
          grossAmount: order.totalAmount,
          paidAt,
          gatewayProvider: "manual-external-qris",
          gatewayReference: payload.gatewayReference?.trim() || null,
          transactionId: payload.gatewayReference?.trim() || `manual-qris-${order.invoiceNumber}`,
        },
      });

      const updatedOrder = await finalizePaidOrderTx(tx, orderId, paidAt);

      return { transaction, updatedOrder };
    });

    return {
      transaction,
      order: await getOrderWithLatestPayment(updatedOrder.id),
      receiptUrl: updatedOrder.receiptToken ? getReceiptPublicUrl(updatedOrder.receiptToken) : null,
    };
  },

  async getOrderPaymentStatus(orderId: string, user: RequestUser) {
    const order = await getOrderWithLatestPayment(orderId);
    if (!order) {
      throw new AppError("Order not found", 404);
    }

    ensureOrderInScope(order, user);

    return {
      order,
      payment: order.paymentTransactions[0] ?? null,
      receiptUrl: order.receiptToken ? getReceiptPublicUrl(order.receiptToken) : null,
    };
  },

  async handleQrisWebhook() {
    throw new AppError("QRIS webhook is disabled because QRIS is confirmed manually by the cashier.", 400);
  },
};
