import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { inventoryService } from "./inventory.service";

export const inventoryController = {
  async stockIn(req: Request, res: Response) {
    return sendSuccess(res, await inventoryService.stockIn(req.body), "Stock added", 201);
  },

  async adjustStock(req: Request, res: Response) {
    return sendSuccess(res, await inventoryService.adjustStock(req.body), "Stock adjusted");
  },

  async getLowStock(_req: Request, res: Response) {
    return sendSuccess(res, await inventoryService.getLowStock());
  },

  async listMovements(_req: Request, res: Response) {
    return sendSuccess(res, await inventoryService.listMovements());
  },
};
