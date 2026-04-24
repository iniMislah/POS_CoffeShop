import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { reportsController } from "./reports.controller";
import { dateRangeQuerySchema } from "./reports.validation";

export const reportRoutes = Router();

reportRoutes.use(authorize(UserRole.ADMIN));
reportRoutes.get("/sales-summary", validateRequest(dateRangeQuerySchema, "query"), asyncHandler(reportsController.salesSummary));
reportRoutes.get("/transactions", validateRequest(dateRangeQuerySchema, "query"), asyncHandler(reportsController.transactionList));
reportRoutes.get("/products", validateRequest(dateRangeQuerySchema, "query"), asyncHandler(reportsController.productSalesSummary));
reportRoutes.get("/payments", validateRequest(dateRangeQuerySchema, "query"), asyncHandler(reportsController.paymentSummary));
reportRoutes.get("/stock-movements", validateRequest(dateRangeQuerySchema, "query"), asyncHandler(reportsController.stockMovements));
