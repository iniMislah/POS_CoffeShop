import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const recipesService = {
  async getByProduct(productId: string, variantId?: string | null) {
    const recipe = await prisma.recipe.findFirst({
      where: {
        productId,
        variantId: variantId ?? null,
      },
      include: {
        product: true,
        variant: true,
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

  async upsert(productId: string, payload: { variantId?: string | null; items: Array<{ ingredientId: string; qtyUsed: number }> }) {
    const product = await prisma.product.findUnique({ where: { id: productId } });
    if (!product) {
      throw new AppError("Product not found", 404);
    }

    const variantId = payload.variantId ?? null;
    if (variantId) {
      const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
      if (!variant || variant.productId !== productId) {
        throw new AppError("Variant not found for this product", 400);
      }
    }

    return prisma.$transaction(async (tx) => {
      const existingRecipe = await tx.recipe.findFirst({
        where: {
          productId,
          variantId,
        },
      });

      const recipe = existingRecipe
        ? await tx.recipe.update({
            where: { id: existingRecipe.id },
            data: {},
          })
        : await tx.recipe.create({
            data: {
              productId,
              variantId,
            },
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
          variant: true,
          recipeItems: {
            include: {
              ingredient: true,
            },
          },
        },
      });
    });
  },

  async calculateHpp(productId: string, variantId?: string | null) {
    const recipe = await this.getByProduct(productId, variantId);

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
      variantId: recipe.variantId,
      variantName: recipe.variant?.name ?? null,
      items,
      totalHpp,
    };
  },
};
