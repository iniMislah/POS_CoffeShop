import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const ingredientsService = {
  async list() {
    return prisma.ingredient.findMany({
      orderBy: { name: "asc" },
    });
  },

  async create(payload: { name: string; unit: string; currentStock: number; minimumStock: number; costPerUnit: number }) {
    return prisma.ingredient.create({
      data: payload,
    });
  },

  async update(id: string, payload: Partial<{ name: string; unit: string; currentStock: number; minimumStock: number; costPerUnit: number }>) {
    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) {
      throw new AppError("Ingredient not found", 404);
    }

    return prisma.ingredient.update({
      where: { id },
      data: payload,
    });
  },

  async remove(id: string) {
    const ingredient = await prisma.ingredient.findUnique({ where: { id } });
    if (!ingredient) {
      throw new AppError("Ingredient not found", 404);
    }

    await prisma.ingredient.delete({ where: { id } });
  },
};
