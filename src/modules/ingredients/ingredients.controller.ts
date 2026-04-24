import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { ingredientsService } from "./ingredients.service";

export const ingredientsController = {
  async list(_req: Request, res: Response) {
    return sendSuccess(res, await ingredientsService.list());
  },

  async create(req: Request, res: Response) {
    return sendSuccess(res, await ingredientsService.create(req.body), "Ingredient created", 201);
  },

  async update(req: Request, res: Response) {
    return sendSuccess(res, await ingredientsService.update(req.params.id, req.body), "Ingredient updated");
  },

  async remove(req: Request, res: Response) {
    await ingredientsService.remove(req.params.id);
    return sendSuccess(res, null, "Ingredient deleted");
  },
};
