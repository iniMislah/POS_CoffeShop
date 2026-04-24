import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { categoriesService } from "./categories.service";

export const categoriesController = {
  async list(_req: Request, res: Response) {
    return sendSuccess(res, await categoriesService.list());
  },

  async create(req: Request, res: Response) {
    return sendSuccess(res, await categoriesService.create(req.body), "Category created", 201);
  },

  async update(req: Request, res: Response) {
    return sendSuccess(res, await categoriesService.update(req.params.id, req.body), "Category updated");
  },

  async remove(req: Request, res: Response) {
    await categoriesService.remove(req.params.id);
    return sendSuccess(res, null, "Category deleted");
  },
};
