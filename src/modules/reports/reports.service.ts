import { PaymentStatus } from "@prisma/client";

import { prisma } from "../../lib/prisma";

const getRange = (startDate: Date, endDate: Date) => ({
  gte: startDate,
  lte: endDate,
});

export const reportsService = {
  async salesSummary(startDate: Date, endDate: Date) {
    const orders = await prisma.order.findMany({
      where: {
        createdAt: getRange(startDate, endDate),
        paymentStatus: PaymentStatus.PAID,
      },
      include: {
        paymentTransactions: true,
      },
    });

    const grossSales = orders.reduce((sum, order) => sum + Number(order.totalAmount), 0);
    const subtotal = orders.reduce((sum, order) => sum + Number(order.subtotal), 0);
    const taxAmount = orders.reduce((sum, order) => sum + Number(order.taxAmount), 0);
    const serviceAmount = orders.reduce((sum, order) => sum + Number(order.serviceAmount), 0);

    return {
      totalOrders: orders.length,
      subtotal,
      taxAmount,
      serviceAmount,
      grossSales,
    };
  },

  async transactionList(startDate: Date, endDate: Date) {
    return prisma.order.findMany({
      where: {
        createdAt: getRange(startDate, endDate),
      },
      orderBy: { createdAt: "desc" },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        paymentTransactions: true,
        orderItems: true,
      },
    });
  },

  async productSalesSummary(startDate: Date, endDate: Date) {
    const items = await prisma.orderItem.findMany({
      where: {
        order: {
          createdAt: getRange(startDate, endDate),
          paymentStatus: PaymentStatus.PAID,
        },
      },
    });

    const summaryMap = new Map<string, { productId: string; productName: string; qty: number; revenue: number }>();

    for (const item of items) {
      const existing = summaryMap.get(item.productId) ?? {
        productId: item.productId,
        productName: item.productNameSnapshot,
        qty: 0,
        revenue: 0,
      };

      existing.qty += item.qty;
      existing.revenue += Number(item.lineTotal);

      summaryMap.set(item.productId, existing);
    }

    return Array.from(summaryMap.values()).sort((a, b) => b.qty - a.qty);
  },

  async paymentSummary(startDate: Date, endDate: Date) {
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        createdAt: getRange(startDate, endDate),
      },
    });

    const summaryMap = new Map<string, { method: string; totalAmount: number; count: number; paidCount: number }>();

    for (const payment of payments) {
      const existing = summaryMap.get(payment.method) ?? {
        method: payment.method,
        totalAmount: 0,
        count: 0,
        paidCount: 0,
      };

      existing.totalAmount += Number(payment.amount);
      existing.count += 1;
      existing.paidCount += payment.status === PaymentStatus.PAID ? 1 : 0;

      summaryMap.set(payment.method, existing);
    }

    return Array.from(summaryMap.values());
  },

  async stockMovements(startDate: Date, endDate: Date) {
    return prisma.stockMovement.findMany({
      where: {
        createdAt: getRange(startDate, endDate),
      },
      orderBy: { createdAt: "desc" },
      include: {
        ingredient: true,
      },
    });
  },
};
