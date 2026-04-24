import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { reportsService } from "./reports.service";

const getDates = (req: Request) => {
  const query = req.query as { startDate: Date; endDate: Date };
  return {
    startDate: query.startDate,
    endDate: query.endDate,
  };
};

export const reportsController = {
  async salesSummary(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    return sendSuccess(res, await reportsService.salesSummary(startDate, endDate));
  },

  async transactionList(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    return sendSuccess(res, await reportsService.transactionList(startDate, endDate));
  },

  async productSalesSummary(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    return sendSuccess(res, await reportsService.productSalesSummary(startDate, endDate));
  },

  async paymentSummary(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    return sendSuccess(res, await reportsService.paymentSummary(startDate, endDate));
  },

  async stockMovements(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    return sendSuccess(res, await reportsService.stockMovements(startDate, endDate));
  },
};
