import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const modifiersService = {
  async list(productId?: string) {
    return prisma.modifier.findMany({
      where: productId ? { productId } : undefined,
      orderBy: { name: "asc" },
      include: { product: true },
    });
  },

  async create(payload: { productId: string; name: string; price: number }) {
    return prisma.modifier.create({
      data: payload,
    });
  },

  async update(id: string, payload: Partial<{ productId: string; name: string; price: number }>) {
    const modifier = await prisma.modifier.findUnique({ where: { id } });
    if (!modifier) {
      throw new AppError("Modifier not found", 404);
    }

    return prisma.modifier.update({
      where: { id },
      data: payload,
    });
  },

  async remove(id: string) {
    const modifier = await prisma.modifier.findUnique({ where: { id } });
    if (!modifier) {
      throw new AppError("Modifier not found", 404);
    }

    await prisma.modifier.delete({ where: { id } });
  },
};
