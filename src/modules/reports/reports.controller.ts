import type { Request, Response } from "express";

import { AppError } from "../../common/app-error";
import { sendSuccess } from "../../common/response";
import { reportsService } from "./reports.service";

const DEFAULT_REPORT_RANGE_DAYS = 30;

const parsePagination = (req: Request) => {
  const page = req.query.page === undefined ? 1 : Number(req.query.page);
  const limit = req.query.limit === undefined ? 50 : Number(req.query.limit);

  if (!Number.isInteger(page) || page < 1) {
    throw new AppError("Page must be a positive integer", 400);
  }

  if (!Number.isInteger(limit) || limit < 1 || limit > 100) {
    throw new AppError("Limit must be an integer between 1 and 100", 400);
  }

  return { page, limit };
};

const getDates = (req: Request) => {
  const query = req.query as unknown as { startDate?: Date; endDate?: Date };
  const today = new Date();
  const defaultStartDate = new Date(today);
  defaultStartDate.setDate(today.getDate() - (DEFAULT_REPORT_RANGE_DAYS - 1));
  defaultStartDate.setHours(0, 0, 0, 0);
  today.setHours(23, 59, 59, 999);

  const startDate = query.startDate ? new Date(query.startDate) : defaultStartDate;
  const endDate = query.endDate ? new Date(query.endDate) : today;
  startDate.setHours(0, 0, 0, 0);
  endDate.setHours(23, 59, 59, 999);

  if (startDate > endDate) {
    throw new AppError("startDate must be earlier than or equal to endDate.", 400);
  }

  return {
    startDate,
    endDate,
  };
};

export const reportsController = {
  async salesSummary(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    return sendSuccess(res, await reportsService.salesSummary(startDate, endDate));
  },

  async transactionList(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    return sendSuccess(res, await reportsService.transactionList(startDate, endDate, parsePagination(req)));
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

  async exportOrders(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    const workbook = await reportsService.exportOrdersReport(startDate, endDate);
    const currentDate = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="coffee-shop-order-history-${currentDate}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },

  async exportSales(req: Request, res: Response) {
    const { startDate, endDate } = getDates(req);
    const workbook = await reportsService.exportOrdersReport(startDate, endDate);
    const currentDate = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename="coffee-shop-sales-report-${currentDate}.xlsx"`);
    await workbook.xlsx.write(res);
    res.end();
  },
};
