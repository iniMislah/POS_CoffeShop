import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { receiptsService } from "./receipts.service";

export const receiptsController = {
  async getPublicReceipt(req: Request, res: Response) {
    return sendSuccess(
      res,
      await receiptsService.getPublicReceipt(req.params.token, req.headers["user-agent"]),
    );
  },
};
