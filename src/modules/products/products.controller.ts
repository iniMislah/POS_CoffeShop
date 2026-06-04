import type { Request, Response } from "express";

import { AppError } from "../../common/app-error";
import { sendSuccess } from "../../common/response";
import { productsService } from "./products.service";

export const productsController = {
  async list(_req: Request, res: Response) {
    return sendSuccess(res, await productsService.list());
  },

  async getById(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await productsService.getById(req.params.id, req.user.role));
  },

  async create(req: Request, res: Response) {
    return sendSuccess(res, await productsService.create(req.body), "Product created", 201);
  },

  async update(req: Request, res: Response) {
    return sendSuccess(res, await productsService.update(req.params.id, req.body), "Product updated");
  },

  async remove(req: Request, res: Response) {
    const result = await productsService.remove(req.params.id);
    return sendSuccess(
      res,
      result,
      result.mode === "soft-delete" ? "Product archived from management list" : "Product deleted",
    );
  },

  async export(req: Request, res: Response) {
    const workbook = await productsService.exportActiveProducts();
    const currentDate = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="coffee-shop-product-list-${currentDate}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },

  async createVariant(req: Request, res: Response) {
    return sendSuccess(res, await productsService.createVariant(req.params.productId, req.body), "Variant created", 201);
  },

  async updateVariant(req: Request, res: Response) {
    return sendSuccess(res, await productsService.updateVariant(req.params.variantId, req.body), "Variant updated");
  },

  async deleteVariant(req: Request, res: Response) {
    await productsService.deleteVariant(req.params.variantId);
    return sendSuccess(res, null, "Variant deleted");
  },
};
