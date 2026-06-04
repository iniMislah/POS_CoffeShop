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
              recipes: {
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
          variant: {
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

type RequiredIngredient = {
  ingredientId: string;
  ingredientName: string;
  unit: string;
  currentStock: number;
  requiredQty: number;
};

export const inventoryService = {
  async stockIn(payload: { ingredientId: string; qty: number; note?: string }) {
    return prisma.$transaction(async (tx) => {
      const ingredient = await tx.ingredient.findFirst({
        where: { id: payload.ingredientId, isActive: true },
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
      const ingredient = await tx.ingredient.findFirst({
        where: { id: payload.ingredientId, isActive: true },
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
      where: { isActive: true },
      orderBy: { currentStock: "asc" },
    });

    return ingredients.filter((ingredient) => Number(ingredient.currentStock) <= Number(ingredient.minimumStock));
  },

  async getStockAlerts() {
    const ingredients = await prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { currentStock: "asc" },
      select: {
        id: true,
        name: true,
        currentStock: true,
        minimumStock: true,
        unit: true,
      },
    });

    return ingredients
      .filter((ingredient) => Number(ingredient.currentStock) <= Number(ingredient.minimumStock))
      .map((ingredient) => ({
        ...ingredient,
        status: Number(ingredient.currentStock) <= 0 ? "OUT_OF_STOCK" : "LOW",
      }));
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
    const deductionState = await tx.order.findUnique({
      where: { id: orderId },
      select: { stockDeductedAt: true },
    });

    if (deductionState?.stockDeductedAt) {
      return { alreadyDeducted: true };
    }

    const order = await getPaidOrderWithRecipe(tx, orderId);
    const requiredByIngredient = new Map<string, RequiredIngredient>();

    for (const orderItem of order.orderItems) {
      const productRecipe = orderItem.product.recipes.find((recipe) => recipe.variantId === null);
      const recipeItems = orderItem.variant?.recipe?.recipeItems ?? productRecipe?.recipeItems ?? [];

      if (recipeItems.length === 0) {
        throw new AppError("Recipe bahan baku untuk produk ini belum dikonfigurasi.", 400);
      }

      for (const recipeItem of recipeItems) {
        const requiredQty = Number(recipeItem.qtyUsed) * orderItem.qty;
        const existing = requiredByIngredient.get(recipeItem.ingredientId);

        requiredByIngredient.set(recipeItem.ingredientId, {
          ingredientId: recipeItem.ingredientId,
          ingredientName: recipeItem.ingredient.name,
          unit: recipeItem.ingredient.unit,
          currentStock: Number(recipeItem.ingredient.currentStock),
          requiredQty: (existing?.requiredQty ?? 0) + requiredQty,
        });
      }
    }

    for (const item of requiredByIngredient.values()) {
      if (item.currentStock < item.requiredQty) {
        throw new AppError(
          `Stok ${item.ingredientName} tidak cukup. Tersedia ${item.currentStock.toLocaleString("id-ID")} ${item.unit}, dibutuhkan ${item.requiredQty.toLocaleString("id-ID")} ${item.unit}.`,
          400,
        );
      }
    }

    for (const item of requiredByIngredient.values()) {
      await tx.ingredient.update({
        where: { id: item.ingredientId },
        data: {
          currentStock: {
            decrement: item.requiredQty,
          },
        },
      });

      await tx.stockMovement.create({
        data: {
          ingredientId: item.ingredientId,
          type: StockMovementType.STOCK_OUT,
          qty: item.requiredQty,
          note: `ORDER_SALE - ${order.invoiceNumber}`,
          referenceId: orderId,
        },
      });
    }

    await tx.order.update({
      where: { id: orderId },
      data: {
        stockDeductedAt: new Date(),
      }
    });

    return { alreadyDeducted: false };
  },
};
