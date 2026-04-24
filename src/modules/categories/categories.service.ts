import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const categoriesService = {
  async list() {
    return prisma.category.findMany({
      orderBy: { name: "asc" },
    });
  },

  async create(payload: { name: string }) {
    return prisma.category.create({
      data: payload,
    });
  },

  async update(id: string, payload: { name: string }) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    return prisma.category.update({
      where: { id },
      data: payload,
    });
  },

  async remove(id: string) {
    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) {
      throw new AppError("Category not found", 404);
    }
    await prisma.category.delete({ where: { id } });
  },
};
