import type { Request, Response } from "express";

import { AppError } from "../../common/app-error";
import { sendSuccess } from "../../common/response";
import { receiptsService } from "./receipts.service";

export const receiptsController = {
  async getPublicReceipt(req: Request, res: Response) {
    return sendSuccess(
      res,
      await receiptsService.getPublicReceipt(req.params.token, req.headers["user-agent"]),
    );
  },

  async getPublicReceiptPdf(req: Request, res: Response) {
    const { buffer, fileName } = await receiptsService.getReceiptPdf(req.params.token, req.headers["user-agent"]);
    const download = req.query.download === "true";

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `${download ? "attachment" : "inline"}; filename=\"${fileName}\"`);
    return res.send(buffer);
  },

  async getReceiptQr(req: Request, res: Response) {
    if (!req.user) {
      throw new AppError("Unauthorized", 401);
    }

    return sendSuccess(res, await receiptsService.getReceiptQr(req.params.orderId, req.user));
  },
};
