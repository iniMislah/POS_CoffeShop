import type { Request, Response } from "express";

import { AppError } from "../../common/app-error";
import { sendSuccess } from "../../common/response";
import { ordersService } from "./orders.service";
import { receiptsService } from "../receipts/receipts.service";

const parsePagination = (query: Request["query"]) => {
  const page = query.page === undefined ? 1 : Number(query.page);
  const limit = query.limit === undefined ? 50 : Number(query.limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Page must be a positive integer", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Limit must be an integer between 1 and 100", 400);
  }

  return { page, limit };
};

export const ordersController = {
  async list(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await ordersService.list(req.user, parsePagination(req.query)));
  },

  async listRecent(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    const limit = req.query.limit === undefined ? 10 : Number(req.query.limit);

    if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
      throw new AppError("Limit must be an integer between 1 and 100", 400);
    }

    return sendSuccess(res, await ordersService.listRecent(req.user, limit));
  },

  async getById(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await ordersService.getById(req.params.id, req.user));
  },

  async getReceiptQr(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await receiptsService.getReceiptQr(req.params.id, req.user));
  },

  async createDraft(req: Request, res: Response) {
    const cashierId = req.user?.id;
    if (!cashierId) {
      throw new AppError("Cashier is required", 400);
    }
    return sendSuccess(res, await ordersService.createDraft(cashierId, req.body.customerId), "Draft order created", 201);
  },

  async addItem(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await ordersService.addItem(req.params.id, req.body, req.user), "Order item added");
  },

  async checkout(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await ordersService.checkout(req.params.id, req.body, req.user), "Order checked out");
  },

  async cancel(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await ordersService.cancel(req.params.id, req.user), "Order cancelled");
  },
};
