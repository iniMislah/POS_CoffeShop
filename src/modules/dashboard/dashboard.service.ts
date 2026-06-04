import { OrderStatus, PaymentStatus, Prisma } from "@prisma/client";

import { prisma } from "../../lib/prisma";
import type { DashboardPeriod } from "./dashboard.validation";

const addMonths = (date: Date, months: number) => {
  const targetYear = date.getFullYear();
  const targetMonth = date.getMonth() + months;
  const lastDayOfTargetMonth = new Date(targetYear, targetMonth + 1, 0).getDate();

  return new Date(targetYear, targetMonth, Math.min(date.getDate(), lastDayOfTargetMonth));
};

const getPeriodRange = (period: DashboardPeriod) => {
  const now = new Date();
  const end = now;

  if (period === "today") {
    return { start: new Date(now.getFullYear(), now.getMonth(), now.getDate()), end };
  }

  if (period === "last-1-week") {
    return { start: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000), end };
  }

  if (period === "last-1-month") {
    return { start: addMonths(now, -1), end };
  }

  if (period === "last-3-months") {
    return { start: addMonths(now, -3), end };
  }

  return { start: new Date(0), end };
};

const paidOrderWhere = (period: DashboardPeriod): Prisma.OrderItemWhereInput => {
  const { start, end } = getPeriodRange(period);

  return {
    order: {
      status: OrderStatus.PAID,
      paymentStatus: PaymentStatus.PAID,
      paidAt: {
        gte: start,
        lt: end,
      },
    },
  };
};

const mapProductGroup = (item: {
  productId: string;
  productNameSnapshot: string;
  _sum: {
    qty: number | null;
    lineTotal: Prisma.Decimal | null;
  };
}) => ({
  productId: item.productId,
  productName: item.productNameSnapshot,
  quantitySold: item._sum.qty ?? 0,
  revenue: Number(item._sum.lineTotal ?? 0),
});

const getTrendBucket = (date: Date, period: DashboardPeriod) => {
  return date.toISOString().slice(0, 10);
};

export const dashboardService = {
  async getSummary(period: DashboardPeriod) {
    const { start, end } = getPeriodRange(period);
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const todayRange = {
      gte: todayStart,
      lt: now,
    };
    const periodWhere =
      period === "all-time"
        ? {}
        : {
            createdAt: {
              gte: start,
              lt: end,
            },
          };

    const [paidOrdersToday, successPaymentsToday, pendingPayments, totalOrders] = await Promise.all([
      prisma.order.findMany({
        where: {
          status: OrderStatus.PAID,
          paymentStatus: PaymentStatus.PAID,
          createdAt: todayRange,
        },
        select: {
          subtotal: true,
          serviceAmount: true,
        },
      }),
      prisma.paymentTransaction.count({
        where: {
          status: PaymentStatus.PAID,
          createdAt: todayRange,
        },
      }),
      prisma.paymentTransaction.count({
        where: {
          status: PaymentStatus.PENDING,
        },
      }),
      prisma.order.count({
        where: periodWhere,
      }),
    ]);

    const salesToday = paidOrdersToday.reduce(
      (sum, order) => sum + Number(order.subtotal) + Number(order.serviceAmount),
      0,
    );

    return {
      salesToday,
      paidOrdersToday: paidOrdersToday.length,
      successPaymentsToday,
      pendingPayments,
      totalOrders,
    };
  },

  async getTopProducts(period: DashboardPeriod) {
    const items = await prisma.orderItem.groupBy({
      by: ["productId", "productNameSnapshot"],
      where: paidOrderWhere(period),
      _sum: {
        qty: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: {
          qty: "desc",
        },
      },
      take: 8,
    });

    return items.map(mapProductGroup);
  },

  async getTopRevenueProducts(period: DashboardPeriod) {
    const items = await prisma.orderItem.groupBy({
      by: ["productId", "productNameSnapshot"],
      where: paidOrderWhere(period),
      _sum: {
        qty: true,
        lineTotal: true,
      },
      orderBy: {
        _sum: {
          lineTotal: "desc",
        },
      },
      take: 8,
    });

    return items.map(mapProductGroup);
  },

  async getSalesTrend(period: DashboardPeriod) {
    const { start, end } = getPeriodRange(period);
    const orders = await prisma.order.findMany({
      where: {
        status: OrderStatus.PAID,
        paymentStatus: PaymentStatus.PAID,
        paidAt: {
          gte: start,
          lt: end,
        },
      },
      select: {
        paidAt: true,
        subtotal: true,
        serviceAmount: true,
      },
      orderBy: {
        paidAt: "asc",
      },
    });

    const buckets = new Map<string, { label: string; totalSales: number; orderCount: number }>();

    for (const order of orders) {
      const paidAt = order.paidAt;
      if (!paidAt) {
        continue;
      }

      const key = getTrendBucket(paidAt, period);
      const existing = buckets.get(key) ?? { label: key, totalSales: 0, orderCount: 0 };
      existing.totalSales += Number(order.subtotal) + Number(order.serviceAmount);
      existing.orderCount += 1;
      buckets.set(key, existing);
    }

    return Array.from(buckets.values());
  },
};
