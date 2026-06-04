import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { dashboardService } from "./dashboard.service";
import { dashboardPeriodSchema } from "./dashboard.validation";

const getPeriod = (req: Request) => dashboardPeriodSchema.parse(req.query).period;

export const dashboardController = {
  async getSummary(req: Request, res: Response) {
    return sendSuccess(res, await dashboardService.getSummary(getPeriod(req)));
  },

  async getTopProducts(req: Request, res: Response) {
    return sendSuccess(res, await dashboardService.getTopProducts(getPeriod(req)));
  },

  async getTopRevenueProducts(req: Request, res: Response) {
    return sendSuccess(res, await dashboardService.getTopRevenueProducts(getPeriod(req)));
  },

  async getSalesTrend(req: Request, res: Response) {
    return sendSuccess(res, await dashboardService.getSalesTrend(getPeriod(req)));
  },
};
