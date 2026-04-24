import { OrderStatus, PaymentStatus } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { generateInvoiceNumber } from "../../common/utils";
import { prisma } from "../../lib/prisma";

type RecalculateInput = {
  taxAmount?: number;
  serviceAmount?: number;
};

const ensureOrderEditable = (status: OrderStatus) => {
  if (status === OrderStatus.PAID || status === OrderStatus.CANCELLED) {
    throw new AppError("Order cannot be modified", 400);
  }
};

const recalculateTotals = async (orderId: string, input?: RecalculateInput) => {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: true,
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  const subtotal = order.orderItems.reduce((sum, item) => sum + Number(item.lineTotal), 0);
  const taxAmount = input?.taxAmount ?? Number(order.taxAmount);
  const serviceAmount = input?.serviceAmount ?? Number(order.serviceAmount);
  const totalAmount = subtotal + taxAmount + serviceAmount;

  return prisma.order.update({
    where: { id: orderId },
    data: {
      subtotal,
      taxAmount,
      serviceAmount,
      totalAmount,
    },
    include: {
      orderItems: {
        include: {
          modifiers: true,
        },
      },
      paymentTransactions: true,
      cashier: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
    },
  });
};

export const ordersService = {
  async list() {
    return prisma.order.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        orderItems: {
          include: {
            modifiers: true,
          },
        },
        paymentTransactions: true,
      },
    });
  },

  async getById(id: string) {
    const order = await prisma.order.findUnique({
      where: { id },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
        orderItems: {
          include: {
            modifiers: true,
          },
        },
        paymentTransactions: true,
      },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    return order;
  },

  async createDraft(cashierId: string) {
    return prisma.order.create({
      data: {
        cashierId,
        invoiceNumber: generateInvoiceNumber(),
        status: OrderStatus.DRAFT,
        paymentStatus: PaymentStatus.PENDING,
        subtotal: 0,
        taxAmount: 0,
        serviceAmount: 0,
        totalAmount: 0,
      },
      include: {
        cashier: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true,
          },
        },
      },
    });
  },

  async addItem(orderId: string, payload: { productId: string; variantId?: string | null; modifierIds: string[]; qty: number; notes?: string | null }) {
    return prisma.$transaction(async (tx) => {
      const order = await tx.order.findUnique({
        where: { id: orderId },
      });

      if (!order) {
        throw new AppError("Order not found", 404);
      }

      ensureOrderEditable(order.status);

      const product = await tx.product.findUnique({
        where: { id: payload.productId },
      });

      if (!product || !product.isAvailable) {
        throw new AppError("Product unavailable", 400);
      }

      const variant = payload.variantId
        ? await tx.productVariant.findUnique({ where: { id: payload.variantId } })
        : null;

      if (payload.variantId && (!variant || variant.productId !== product.id)) {
        throw new AppError("Variant not found for this product", 400);
      }

      const modifiers = payload.modifierIds.length
        ? await tx.modifier.findMany({
            where: {
              id: { in: payload.modifierIds },
              productId: product.id,
            },
          })
        : [];

      if (modifiers.length !== payload.modifierIds.length) {
        throw new AppError("One or more modifiers are invalid", 400);
      }

      const unitPrice = Number(product.basePrice) + Number(variant?.priceDelta ?? 0);
      const modifierTotal = modifiers.reduce((sum, item) => sum + Number(item.price), 0);
      const lineTotal = (unitPrice + modifierTotal) * payload.qty;

      const orderItem = await tx.orderItem.create({
        data: {
          orderId,
          productId: product.id,
          variantId: variant?.id ?? null,
          productNameSnapshot: product.name,
          variantNameSnapshot: variant?.name ?? null,
          unitPrice,
          qty: payload.qty,
          notes: payload.notes ?? null,
          lineTotal,
        },
      });

      if (modifiers.length > 0) {
        await tx.orderItemModifier.createMany({
          data: modifiers.map((modifier) => ({
            orderItemId: orderItem.id,
            modifierId: modifier.id,
            modifierNameSnapshot: modifier.name,
            price: modifier.price,
          })),
        });
      }

      const refreshedOrder = await tx.order.findUnique({
        where: { id: orderId },
        include: { orderItems: true },
      });

      const subtotal = (refreshedOrder?.orderItems ?? []).reduce((sum, item) => sum + Number(item.lineTotal), 0);
      const totalAmount = subtotal + Number(order.taxAmount) + Number(order.serviceAmount);

      await tx.order.update({
        where: { id: orderId },
        data: {
          subtotal,
          totalAmount,
        },
      });

      return tx.order.findUniqueOrThrow({
        where: { id: orderId },
        include: {
          orderItems: {
            include: {
              modifiers: true,
            },
          },
          paymentTransactions: true,
        },
      });
    });
  },

  async checkout(orderId: string, payload: { taxAmount: number; serviceAmount: number }) {
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: { orderItems: true },
    });

    if (!order) {
      throw new AppError("Order not found", 404);
    }

    ensureOrderEditable(order.status);

    if (order.orderItems.length === 0) {
      throw new AppError("Order has no items", 400);
    }

    await recalculateTotals(orderId, payload);

    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.PENDING_PAYMENT,
        paymentStatus: PaymentStatus.PENDING,
      },
      include: {
        orderItems: {
          include: {
            modifiers: true,
          },
        },
      },
    });
  },

  async cancel(orderId: string) {
    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      throw new AppError("Order not found", 404);
    }
    if (order.status === OrderStatus.PAID) {
      throw new AppError("Paid order cannot be cancelled", 400);
    }

    return prisma.order.update({
      where: { id: orderId },
      data: {
        status: OrderStatus.CANCELLED,
        paymentStatus: PaymentStatus.FAILED,
      },
    });
  },

  async recalculate(orderId: string, input?: RecalculateInput) {
    return recalculateTotals(orderId, input);
  },
};
