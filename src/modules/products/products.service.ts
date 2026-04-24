import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const productsService = {
  async list() {
    return prisma.product.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        variants: true,
        modifiers: true,
      },
    });
  },

  async getById(id: string) {
    const product = await prisma.product.findUnique({
      where: { id },
      include: {
        category: true,
        variants: true,
        modifiers: true,
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
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  },

  async create(payload: { categoryId: string; name: string; basePrice: number; isAvailable: boolean; imageUrl?: string | null }) {
    return prisma.product.create({
      data: payload,
      include: {
        category: true,
      },
    });
  },

  async update(id: string, payload: Partial<{ categoryId: string; name: string; basePrice: number; isAvailable: boolean; imageUrl: string | null }>) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return prisma.product.update({
      where: { id },
      data: payload,
      include: {
        category: true,
        variants: true,
        modifiers: true,
      },
    });
  },

  async remove(id: string) {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) {
      throw new AppError("Product not found", 404);
    }
    await prisma.product.delete({ where: { id } });
  },

  async createVariant(productId: string, payload: { name: string; priceDelta: number }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return prisma.productVariant.create({
      data: {
        productId,
        ...payload,
      },
    });
  },

  async updateVariant(variantId: string, payload: { name?: string; priceDelta?: number }) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new AppError("Variant not found", 404);
    }

    return prisma.productVariant.update({
      where: { id: variantId },
      data: payload,
    });
  },

  async deleteVariant(variantId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new AppError("Variant not found", 404);
    }
    await prisma.productVariant.delete({ where: { id: variantId } });
  },
};
