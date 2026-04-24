import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { modifiersService } from "./modifiers.service";

export const modifiersController = {
  async list(req: Request, res: Response) {
    const productId = typeof req.query.productId === "string" ? req.query.productId : undefined;
    return sendSuccess(res, await modifiersService.list(productId));
  },

  async create(req: Request, res: Response) {
    return sendSuccess(res, await modifiersService.create(req.body), "Modifier created", 201);
  },

  async update(req: Request, res: Response) {
    return sendSuccess(res, await modifiersService.update(req.params.id, req.body), "Modifier updated");
  },

  async remove(req: Request, res: Response) {
    await modifiersService.remove(req.params.id);
    return sendSuccess(res, null, "Modifier deleted");
  },
};
