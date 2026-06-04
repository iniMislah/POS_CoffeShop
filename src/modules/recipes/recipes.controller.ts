import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { recipesService } from "./recipes.service";

export const recipesController = {
  async getByProduct(req: Request, res: Response) {
    const variantId = typeof req.query.variantId === "string" ? req.query.variantId : undefined;
    return sendSuccess(res, await recipesService.getByProduct(req.params.productId, variantId));
  },

  async upsert(req: Request, res: Response) {
    return sendSuccess(res, await recipesService.upsert(req.params.productId, req.body), "Recipe saved");
  },

  async calculateHpp(req: Request, res: Response) {
    const variantId = typeof req.query.variantId === "string" ? req.query.variantId : undefined;
    return sendSuccess(res, await recipesService.calculateHpp(req.params.productId, variantId));
  },
};
