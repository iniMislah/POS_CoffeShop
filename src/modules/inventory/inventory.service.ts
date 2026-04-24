import { PaymentStatus, Prisma, StockMovementType } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

const getPaidOrderWithRecipe = async (db: Prisma.TransactionClient | typeof prisma, orderId: string) => {
  const order = await db.order.findUnique({
    where: { id: orderId },
    include: {
      orderItems: {
        include: {
          product: {
            include: {
              recipe: {
                include: {
                  recipeItems: {
                    include: {
                      ingredient: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  if (!order) {
    throw new AppError("Order not found", 404);
  }

  if (order.paymentStatus !== PaymentStatus.PAID) {
    throw new AppError("Inventory deduction only allowed for paid orders", 400);
  }

  return order;
};

export const inventoryService = {
  async stockIn(payload: { ingredientId: string; qty: number; note?: string }) {
    return prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: payload.ingredientId },
      });

      if (!ingredient) {
        throw new AppError("Ingredient not found", 404);
      }

      await tx.ingredient.update({
        where: { id: payload.ingredientId },
        data: {
          currentStock: {
            increment: payload.qty,
          },
        },
      });

      return tx.stockMovement.create({
        data: {
          ingredientId: payload.ingredientId,
          type: StockMovementType.STOCK_IN,
          qty: payload.qty,
          note: payload.note,
        },
      });
    });
  },

  async adjustStock(payload: { ingredientId: string; newStock: number; note?: string }) {
    return prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findUnique({
        where: { id: payload.ingredientId },
      });

      if (!ingredient) {
        throw new AppError("Ingredient not found", 404);
      }

      const difference = payload.newStock - Number(ingredient.currentStock);

      await tx.ingredient.update({
        where: { id: payload.ingredientId },
        data: {
          currentStock: payload.newStock,
        },
      });

      return tx.stockMovement.create({
        data: {
          ingredientId: payload.ingredientId,
          type: StockMovementType.ADJUSTMENT,
          qty: difference,
          note: payload.note,
        },
      });
    });
  },

  async getLowStock() {
    const ingredients = await prisma.ingredient.findMany({
      orderBy: { currentStock: "asc" },
    });

    return ingredients.filter((ingredient) => Number(ingredient.currentStock) <= Number(ingredient.minimumStock));
  },

  async listMovements() {
    return prisma.stockMovement.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        ingredient: true,
      },
    });
  },

  async deductIngredientsForPaidOrder(orderId: string) {
    return prisma.$transaction(async (tx) => {
      return inventoryService.deductIngredientsForPaidOrderTx(tx, orderId);
    });
  },

  async deductIngredientsForPaidOrderTx(tx: Prisma.TransactionClient, orderId: string) {
    const existingDeduction = await tx.stockMovement.findFirst({
      where: {
        type: StockMovementType.SALE_DEDUCTION,
        referenceId: orderId,
      },
    });

    if (existingDeduction) {
      return { alreadyDeducted: true };
    }

    const order = await getPaidOrderWithRecipe(tx, orderId);

    for (const orderItem of order.orderItems) {
      const recipeItems = orderItem.product.recipe?.recipeItems ?? [];

      for (const recipeItem of recipeItems) {
        const requiredQty = Number(recipeItem.qtyUsed) * orderItem.qty;
        const currentStock = Number(recipeItem.ingredient.currentStock);

        if (currentStock < requiredQty) {
          throw new AppError(`Insufficient stock for ingredient ${recipeItem.ingredient.name}`, 400);
        }

        await tx.ingredient.update({
          where: { id: recipeItem.ingredientId },
          data: {
            currentStock: {
              decrement: requiredQty,
            },
          },
        });

        await tx.stockMovement.create({
          data: {
            ingredientId: recipeItem.ingredientId,
            type: StockMovementType.SALE_DEDUCTION,
            qty: -requiredQty,
            note: `Deduction for order ${order.invoiceNumber}`,
            referenceId: orderId,
          },
        });
      }
    }

    return { alreadyDeducted: false };
  },
};
