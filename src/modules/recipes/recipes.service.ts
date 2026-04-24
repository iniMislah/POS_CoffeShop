import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const recipesService = {
  async getByProduct(productId: string) {
    const recipe = await prisma.recipe.findUnique({
      where: { productId },
      include: {
        product: true,
        recipeItems: {
          include: {
            ingredient: true,
          },
        },
      },
    });

    if (!recipe) {
      throw new AppError("Recipe not found", 404);
    }

    return recipe;
  },

  async upsert(productId: string, payload: { items: Array<{ ingredientId: string; qtyUsed: number }> }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return prisma.$transaction(async (tx) => {
      const recipe = await tx.recipe.upsert({
        where: { productId },
        update: {},
        create: { productId },
      });

      await tx.recipeItem.deleteMany({
        where: { recipeId: recipe.id },
      });

      await tx.recipeItem.createMany({
        data: payload.items.map((item) => ({
          recipeId: recipe.id,
          ingredientId: item.ingredientId,
          qtyUsed: item.qtyUsed,
        })),
      });

      return tx.recipe.findUniqueOrThrow({
        where: { id: recipe.id },
        include: {
          product: true,
          recipeItems: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    });
  },

  async calculateHpp(productId: string) {
    const recipe = await this.getByProduct(productId);

    const items = recipe.recipeItems.map((item) => {
      const itemCost = Number(item.qtyUsed) * Number(item.ingredient.costPerUnit);
      return {
        ingredientId: item.ingredientId,
        ingredientName: item.ingredient.name,
        qtyUsed: Number(item.qtyUsed),
        unit: item.ingredient.unit,
        costPerUnit: Number(item.ingredient.costPerUnit),
        itemCost,
      };
    });

    const totalHpp = items.reduce((sum, item) => sum + item.itemCost, 0);

    return {
      productId,
      productName: recipe.product.name,
      items,
      totalHpp,
    };
  },
};
