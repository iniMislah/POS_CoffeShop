import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { dashboardController } from "./dashboard.controller";
import { dashboardPeriodSchema } from "./dashboard.validation";

export const dashboardRoutes = Router();

dashboardRoutes.use(authorize(UserRole.ADMIN));
dashboardRoutes.get("/summary", validateRequest(dashboardPeriodSchema, "query"), asyncHandler(dashboardController.getSummary));
dashboardRoutes.get("/top-products", validateRequest(dashboardPeriodSchema, "query"), asyncHandler(dashboardController.getTopProducts));
dashboardRoutes.get("/top-revenue-products", validateRequest(dashboardPeriodSchema, "query"), asyncHandler(dashboardController.getTopRevenueProducts));
dashboardRoutes.get("/sales-trend", validateRequest(dashboardPeriodSchema, "query"), asyncHandler(dashboardController.getSalesTrend));
