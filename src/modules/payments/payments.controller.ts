import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { paymentsService } from "./payments.service";

export const paymentsController = {
  async listTransactions(_req: Request, res: Response) {
    return sendSuccess(res, await paymentsService.listTransactions());
  },

  async payCash(req: Request, res: Response) {
    return sendSuccess(res, await paymentsService.payCash(req.params.orderId, req.body), "Cash payment recorded");
  },

  async createQrisPayment(req: Request, res: Response) {
    return sendSuccess(res, await paymentsService.createQrisPayment(req.params.orderId), "QRIS payment created", 201);
  },

  async getOrderPaymentStatus(req: Request, res: Response) {
    return sendSuccess(res, await paymentsService.getOrderPaymentStatus(req.params.orderId));
  },

  async handleWebhook(req: Request, res: Response) {
    return sendSuccess(res, await paymentsService.handleQrisWebhook(req.body), "Webhook processed");
  },

  async simulateWebhook(req: Request, res: Response) {
    const result = await paymentsService.handleQrisWebhook({
      ...req.body,
      secret: req.body.secret ?? "mock-webhook-secret",
    });
    return sendSuccess(res, result, "Mock webhook processed");
  },
};
