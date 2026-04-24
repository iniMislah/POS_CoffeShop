import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { productsService } from "./products.service";

export const productsController = {
  async list(_req: Request, res: Response) {
    return sendSuccess(res, await productsService.list());
  },

  async getById(req: Request, res: Response) {
    return sendSuccess(res, await productsService.getById(req.params.id));
  },

  async create(req: Request, res: Response) {
    return sendSuccess(res, await productsService.create(req.body), "Product created", 201);
  },

  async update(req: Request, res: Response) {
    return sendSuccess(res, await productsService.update(req.params.id, req.body), "Product updated");
  },

  async remove(req: Request, res: Response) {
    await productsService.remove(req.params.id);
    return sendSuccess(res, null, "Product deleted");
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
