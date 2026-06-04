import { Router } from "express";
import { UserRole } from "@prisma/client";
import { z } from "zod";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { receiptsController } from "./receipts.controller";

const publicRouter = Router();
const privateRouter = Router();

const tokenParamSchema = z.object({
  token: z.string().min(10),
});

const orderIdParamSchema = z.object({
  orderId: z.string().uuid(),
});

publicRouter.get("/:token", validateRequest(tokenParamSchema, "params"), asyncHandler(receiptsController.getPublicReceipt));
publicRouter.get("/:token/pdf", validateRequest(tokenParamSchema, "params"), asyncHandler(receiptsController.getPublicReceiptPdf));
privateRouter.get("/orders/:orderId/qr", authorize(UserRole.ADMIN, UserRole.CASHIER), validateRequest(orderIdParamSchema, "params"), asyncHandler(receiptsController.getReceiptQr));

export const receiptRoutes = {
  publicRouter,
  privateRouter,
};
