import { Prisma, UserRole } from "@prisma/client";
import ExcelJS from "exceljs";

import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

type ProductVariantInput = {
  name: string;
  priceDelta: number;
};

type ProductModifierInput = {
  name: string;
  price: number;
};

type ProductPayload = {
  categoryId: string;
  name: string;
  basePrice: number;
  isAvailable: boolean;
  imageUrl?: string | null;
  variants?: ProductVariantInput[];
  modifiers?: ProductModifierInput[];
};

const activeProductInclude = {
  category: true,
  variants: true,
  modifiers: true,
} satisfies Prisma.ProductInclude;

const normalizeVariants = (variants?: ProductVariantInput[]) =>
  (variants ?? []).map((variant) => ({
    name: variant.name.trim(),
    priceDelta: variant.priceDelta,
  }));

const normalizeModifiers = (modifiers?: ProductModifierInput[]) =>
  (modifiers ?? []).map((modifier) => ({
    name: modifier.name.trim(),
    price: modifier.price,
  }));

const ensureActiveProduct = async (id: string) => {
  const product = await prisma.product.findFirst({
    where: {
      id,
      deletedAt: null,
    },
    include: activeProductInclude,
  });

  if (!product) {
    throw new AppError("Product not found", 404);
  }

  return product;
};

const syncProductOptions = async (
  tx: Prisma.TransactionClient,
  productId: string,
  variants?: ProductVariantInput[],
  modifiers?: ProductModifierInput[],
) => {
  const existing = await tx.product.findUniqueOrThrow({
    where: { id: productId },
    include: {
      variants: true,
      modifiers: true,
    },
  });

  if (variants) {
    for (const currentVariant of existing.variants) {
      const nextVariant = variants.find((variant) => variant.name === currentVariant.name);
      if (!nextVariant) {
        await tx.productVariant.delete({
          where: {
            id: currentVariant.id,
          },
        });
        continue;
      }

      await tx.productVariant.update({
        where: { id: currentVariant.id },
        data: {
          priceDelta: nextVariant.priceDelta,
        },
      });
    }

    for (const nextVariant of variants) {
      const currentVariant = existing.variants.find((variant) => variant.name === nextVariant.name);
      if (!currentVariant) {
        await tx.productVariant.create({
          data: {
            productId,
            name: nextVariant.name,
            priceDelta: nextVariant.priceDelta,
          },
        });
      }
    }
  }

  if (modifiers) {
    for (const currentModifier of existing.modifiers) {
      const nextModifier = modifiers.find((modifier) => modifier.name === currentModifier.name);
      if (!nextModifier) {
        try {
          await tx.modifier.delete({
            where: {
              id: currentModifier.id,
            },
          });
        } catch (error) {
          if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2003") {
            throw new AppError(
              `Modifier "${currentModifier.name}" sudah pernah dipakai transaksi dan tidak bisa dihapus dari histori.`,
              409,
            );
          }
          throw error;
        }
        continue;
      }

      await tx.modifier.update({
        where: { id: currentModifier.id },
        data: {
          price: nextModifier.price,
        },
      });
    }

    for (const nextModifier of modifiers) {
      const currentModifier = existing.modifiers.find((modifier) => modifier.name === nextModifier.name);
      if (!currentModifier) {
        await tx.modifier.create({
          data: {
            productId,
            name: nextModifier.name,
            price: nextModifier.price,
          },
        });
      }
    }
  }
};

const applyExportSheetStyle = (worksheet: ExcelJS.Worksheet, headerRowIndex: number) => {
  const headerRow = worksheet.getRow(headerRowIndex);
  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "FF6F4E37" },
    };
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin", color: { argb: "FFD8C3AF" } },
      left: { style: "thin", color: { argb: "FFD8C3AF" } },
      bottom: { style: "thin", color: { argb: "FFD8C3AF" } },
      right: { style: "thin", color: { argb: "FFD8C3AF" } },
    };
  });

  worksheet.views = [{ state: "frozen", ySplit: headerRowIndex }];
  worksheet.autoFilter = {
    from: { row: headerRowIndex, column: 1 },
    to: { row: headerRowIndex, column: worksheet.columns.length },
  };

  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber < headerRowIndex) {
      return;
    }

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE7D9CC" } },
        left: { style: "thin", color: { argb: "FFE7D9CC" } },
        bottom: { style: "thin", color: { argb: "FFE7D9CC" } },
        right: { style: "thin", color: { argb: "FFE7D9CC" } },
      };
    });
  });

  worksheet.columns.forEach((column) => {
    let width = 14;
    column.eachCell?.({ includeEmpty: true }, (cell) => {
      width = Math.max(width, String(cell.value ?? "").length + 2);
    });
    column.width = Math.min(width, 42);
  });
};

const rupiahFormat = '"Rp"#,##0';

export const productsService = {
  async list() {
    return prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: { createdAt: "desc" },
      include: activeProductInclude,
    });
  },

  async getById(id: string, role: UserRole) {
    const product = await prisma.product.findFirst({
      where: {
        id,
        deletedAt: null,
      },
      include:
        role === UserRole.ADMIN
          ? {
              category: true,
              variants: true,
              modifiers: true,
              recipes: {
                include: {
                  variant: true,
                  recipeItems: {
                    include: {
                      ingredient: true,
                    },
                  },
                },
              },
            }
          : activeProductInclude,
    });

    if (!product) {
      throw new AppError("Product not found", 404);
    }

    return product;
  },

  async create(payload: ProductPayload) {
    try {
      return await prisma.$transaction(async (tx) => {
        const product = await tx.product.create({
          data: {
            categoryId: payload.categoryId,
            name: payload.name.trim(),
            basePrice: payload.basePrice,
            isAvailable: payload.isAvailable,
            imageUrl: payload.imageUrl ?? null,
          },
        });

        await syncProductOptions(
          tx,
          product.id,
          normalizeVariants(payload.variants),
          normalizeModifiers(payload.modifiers),
        );

        return tx.product.findUniqueOrThrow({
          where: { id: product.id },
          include: activeProductInclude,
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Product name already exists in this category.", 409);
      }
      throw error;
    }
  },

  async update(id: string, payload: Partial<ProductPayload>) {
    await ensureActiveProduct(id);

    try {
      return await prisma.$transaction(async (tx) => {
        await tx.product.update({
          where: { id },
          data: {
            categoryId: payload.categoryId,
            name: payload.name?.trim(),
            basePrice: payload.basePrice,
            isAvailable: payload.isAvailable,
            imageUrl: payload.imageUrl,
          },
        });

        if (payload.variants || payload.modifiers) {
          await syncProductOptions(
            tx,
            id,
            payload.variants ? normalizeVariants(payload.variants) : undefined,
            payload.modifiers ? normalizeModifiers(payload.modifiers) : undefined,
          );
        }

        return tx.product.findUniqueOrThrow({
          where: { id },
          include: activeProductInclude,
        });
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
        throw new AppError("Product name already exists in this category.", 409);
      }
      throw error;
    }
  },

  async remove(id: string) {
    await ensureActiveProduct(id);

    const usageCount = await prisma.orderItem.count({
      where: {
        productId: id,
      },
    });

    if (usageCount > 0) {
      await prisma.product.update({
        where: { id },
        data: {
          isAvailable: false,
          deletedAt: new Date(),
        },
      });
      return { mode: "soft-delete" as const };
    }

    await prisma.$transaction(async (tx) => {
      const recipes = await tx.recipe.findMany({
        where: { productId: id },
        select: { id: true },
      });

      if (recipes.length > 0) {
        await tx.recipeItem.deleteMany({
          where: {
            recipeId: {
              in: recipes.map((recipe) => recipe.id),
            },
          },
        });
        await tx.recipe.deleteMany({
          where: {
            id: {
              in: recipes.map((recipe) => recipe.id),
            },
          },
        });
      }

      await tx.modifier.deleteMany({ where: { productId: id } });
      await tx.productVariant.deleteMany({ where: { productId: id } });
      await tx.product.delete({ where: { id } });
    });

    return { mode: "hard-delete" as const };
  },

  async createVariant(productId: string, payload: { name: string; priceDelta: number }) {
    await ensureActiveProduct(productId);

    return prisma.productVariant.create({
      data: {
        productId,
        name: payload.name.trim(),
        priceDelta: payload.priceDelta,
      },
    });
  },

  async updateVariant(variantId: string, payload: { name?: string; priceDelta?: number }) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new AppError("Variant not found", 404);
    }

    await ensureActiveProduct(variant.productId);

    return prisma.productVariant.update({
      where: { id: variantId },
      data: {
        name: payload.name?.trim(),
        priceDelta: payload.priceDelta,
      },
    });
  },

  async deleteVariant(variantId: string) {
    const variant = await prisma.productVariant.findUnique({ where: { id: variantId } });
    if (!variant) {
      throw new AppError("Variant not found", 404);
    }

    await ensureActiveProduct(variant.productId);
    await prisma.productVariant.delete({ where: { id: variantId } });
  },

  async exportActiveProducts() {
    const products = await prisma.product.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: [{ category: { name: "asc" } }, { name: "asc" }],
      include: activeProductInclude,
    });

    const workbook = new ExcelJS.Workbook();
    workbook.creator = "Codex";
    workbook.created = new Date();

    const sheet = workbook.addWorksheet("Products");
    sheet.mergeCells("A1:H1");
    sheet.getCell("A1").value = "Coffee Shop POS - Product List";
    sheet.getCell("A1").font = { size: 18, bold: true, color: { argb: "FF4E342E" } };

    sheet.mergeCells("A2:H2");
    sheet.getCell("A2").value = `Generated At: ${new Intl.DateTimeFormat("id-ID", {
      dateStyle: "medium",
      timeStyle: "short",
    }).format(new Date())}`;
    sheet.getCell("A2").font = { italic: true, color: { argb: "FF7A5C49" } };

    sheet.columns = [
      { header: "Product Name", key: "name" },
      { header: "Category", key: "category" },
      { header: "Base Price", key: "basePrice" },
      { header: "Availability", key: "availability" },
      { header: "Variants", key: "variants" },
      { header: "Modifiers", key: "modifiers" },
      { header: "Created At", key: "createdAt" },
      { header: "Updated At", key: "updatedAt" },
    ];

    const headerRowIndex = 4;
    sheet.spliceRows(headerRowIndex, 0, sheet.columns.map((column) => column.header as string));

    if (products.length === 0) {
      sheet.addRow(["No data available", "", "", "", "", "", "", ""]);
    } else {
      products.forEach((product) => {
        sheet.addRow({
          name: product.name,
          category: product.category.name,
          basePrice: Number(product.basePrice),
          availability: product.isAvailable ? "Available" : "Sold Out",
          variants: product.variants.map((variant) => `${variant.name} (${Number(variant.priceDelta).toLocaleString("id-ID")})`).join(", "),
          modifiers: product.modifiers.map((modifier) => `${modifier.name} (${Number(modifier.price).toLocaleString("id-ID")})`).join(", "),
          createdAt: product.createdAt,
          updatedAt: product.updatedAt,
        });
      });
    }

    sheet.getColumn("basePrice").numFmt = rupiahFormat;
    sheet.getColumn("createdAt").numFmt = "dd/mm/yyyy hh:mm";
    sheet.getColumn("updatedAt").numFmt = "dd/mm/yyyy hh:mm";

    sheet.eachRow((row, rowNumber) => {
      if (rowNumber <= headerRowIndex) {
        return;
      }

      row.getCell(3).alignment = { horizontal: "right" };
      row.getCell(7).alignment = { horizontal: "center" };
      row.getCell(8).alignment = { horizontal: "center" };

      const availabilityCell = row.getCell(4);
      if (availabilityCell.value === "Available") {
        availabilityCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE8F5E9" } };
        availabilityCell.font = { color: { argb: "FF2E7D32" }, bold: true };
      } else {
        availabilityCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3E0" } };
        availabilityCell.font = { color: { argb: "FF8D6E63" }, bold: true };
      }
    });

    applyExportSheetStyle(sheet, headerRowIndex);

    return workbook;
  },
};
