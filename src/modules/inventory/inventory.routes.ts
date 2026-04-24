import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { inventoryController } from "./inventory.controller";
import { stockAdjustmentSchema, stockInSchema } from "./inventory.validation";

export const inventoryRoutes = Router();

inventoryRoutes.get("/low-stock", asyncHandler(inventoryController.getLowStock));
inventoryRoutes.get("/movements", asyncHandler(inventoryController.listMovements));
inventoryRoutes.post("/stock-in", authorize(UserRole.ADMIN), validateRequest(stockInSchema), asyncHandler(inventoryController.stockIn));
inventoryRoutes.post("/adjustment", authorize(UserRole.ADMIN), validateRequest(stockAdjustmentSchema), asyncHandler(inventoryController.adjustStock));
