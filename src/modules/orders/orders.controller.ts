import type { Request, Response } from "express";

import { AppError } from "../../common/app-error";
import { sendSuccess } from "../../common/response";
import { ordersService } from "./orders.service";

export const ordersController = {
  async list(_req: Request, res: Response) {
    return sendSuccess(res, await ordersService.list());
  },

  async getById(req: Request, res: Response) {
    return sendSuccess(res, await ordersService.getById(req.params.id));
  },

  async createDraft(req: Request, res: Response) {
    const cashierId = req.body.cashierId ?? req.user?.id;
    if (!cashierId) {
      throw new AppError("Cashier is required", 400);
    }
    return sendSuccess(res, await ordersService.createDraft(cashierId), "Draft order created", 201);
  },

  async addItem(req: Request, res: Response) {
    return sendSuccess(res, await ordersService.addItem(req.params.id, req.body), "Order item added");
  },

  async checkout(req: Request, res: Response) {
    return sendSuccess(res, await ordersService.checkout(req.params.id, req.body), "Order checked out");
  },

  async cancel(req: Request, res: Response) {
    return sendSuccess(res, await ordersService.cancel(req.params.id), "Order cancelled");
  },
};
