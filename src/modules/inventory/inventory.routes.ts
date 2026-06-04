import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { inventoryController } from "./inventory.controller";
import { stockAdjustmentSchema, stockInSchema } from "./inventory.validation";

export const inventoryRoutes = Router();

inventoryRoutes.get("/alerts", authorize(UserRole.ADMIN, UserRole.CASHIER), asyncHandler(inventoryController.getStockAlerts));
inventoryRoutes.get("/low-stock", authorize(UserRole.ADMIN), asyncHandler(inventoryController.getLowStock));
inventoryRoutes.get("/movements", authorize(UserRole.ADMIN), asyncHandler(inventoryController.listMovements));
inventoryRoutes.post("/stock-in", authorize(UserRole.ADMIN), validateRequest(stockInSchema), asyncHandler(inventoryController.stockIn));
inventoryRoutes.post("/adjustment", authorize(UserRole.ADMIN), validateRequest(stockAdjustmentSchema), asyncHandler(inventoryController.adjustStock));
