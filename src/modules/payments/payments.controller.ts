import type { Request, Response } from "express";

import { AppError } from "../../common/app-error";
import { sendSuccess } from "../../common/response";
import { paymentsService } from "./payments.service";

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

export const paymentsController = {
  async listTransactions(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await paymentsService.listTransactions(req.user, parsePagination(req.query)));
  },

  async payCash(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await paymentsService.payCash(req.params.orderId, req.body, req.user), "Cash payment recorded");
  },

  async createQrisPayment(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await paymentsService.payManualQris(req.params.orderId, req.body, req.user), "QRIS manual payment recorded", 201);
  },

  async getOrderPaymentStatus(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await paymentsService.getOrderPaymentStatus(req.params.orderId, req.user));
  },

  async handleWebhook(req: Request, res: Response) {
    return sendSuccess(res, await paymentsService.handleQrisWebhook(), "Webhook disabled");
  },

  async simulateWebhook(req: Request, res: Response) {
    return sendSuccess(res, await paymentsService.handleQrisWebhook(), "Webhook disabled");
  },
};
