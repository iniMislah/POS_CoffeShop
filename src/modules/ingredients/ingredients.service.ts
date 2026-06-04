import { Prisma, StockMovementType } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const ingredientsService = {
  async list() {
    return prisma.ingredient.findMany({
      where: { isActive: true },
      orderBy: { name: "asc" },
    });
  },

  async create(payload: {
    name: string;
    unit: string;
    currentStock: number;
    minimumStock: number;
    costPerUnit: number;
    note?: string;
  }) {
    try {
      return await prisma.$transaction(async (tx) => {
        const ingredient = await tx.ingredient.create({
          data: {
            name: payload.name.trim(),
            unit: payload.unit.trim(),
            currentStock: payload.currentStock,
            minimumStock: payload.minimumStock,
            costPerUnit: payload.costPerUnit,
          },
        });

        if (payload.currentStock > 0) {
          await tx.stockMovement.create({
            data: {
              ingredientId: ingredient.id,
              type: StockMovementType.STOCK_IN,
              qty: payload.currentStock,
              note: payload.note?.trim() || "Initial stock when ingredient was created",
            },
          });
        }

        return ingredient;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Ingredient name already exists.", 409);
      }
      throw error;
    }
  },

  async update(
    id: string,
    payload: Partial<{ name: string; unit: string; currentStock: number; minimumStock: number; costPerUnit: number }>,
  ) {
    const ingredient = await prisma.ingredient.findFirst({ where: { id, isActive: true } });
    if (!ingredient) {
      throw new AppError("Ingredient not found", 404);
    }

    try {
      return await prisma.ingredient.update({
        where: { id },
        data: {
          name: payload.name?.trim(),
          unit: payload.unit?.trim(),
          currentStock: payload.currentStock,
          minimumStock: payload.minimumStock,
          costPerUnit: payload.costPerUnit,
        },
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Ingredient name already exists.", 409);
      }
      throw error;
    }
  },

  async remove(id: string) {
    const ingredient = await prisma.ingredient.findFirst({ where: { id, isActive: true } });
    if (!ingredient) {
      throw new AppError("Ingredient not found", 404);
    }

    const [recipeUsageCount, movementUsageCount] = await Promise.all([
      prisma.recipeItem.count({ where: { ingredientId: id } }),
      prisma.stockMovement.count({ where: { ingredientId: id } }),
    ]);

    if (recipeUsageCount > 0 || movementUsageCount > 0) {
      await prisma.ingredient.update({
        where: { id },
        data: { isActive: false },
      });
      return { mode: "soft-delete" as const };
    }

    await prisma.ingredient.delete({ where: { id } });
    return { mode: "hard-delete" as const };
  },
};
