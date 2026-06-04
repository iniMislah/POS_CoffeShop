import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { paymentsController } from "./payments.controller";
import { cashPaymentSchema, orderIdParamSchema, qrisManualPaymentSchema, qrisWebhookSchema } from "./payments.validation";

const privateRouter = Router();
const publicRouter = Router();

privateRouter.get("/", authorize(UserRole.ADMIN, UserRole.CASHIER), asyncHandler(paymentsController.listTransactions));
privateRouter.post("/orders/:orderId/cash", authorize(UserRole.ADMIN, UserRole.CASHIER), validateRequest(orderIdParamSchema, "params"), validateRequest(cashPaymentSchema), asyncHandler(paymentsController.payCash));
privateRouter.post("/orders/:orderId/qris", authorize(UserRole.ADMIN, UserRole.CASHIER), validateRequest(orderIdParamSchema, "params"), validateRequest(qrisManualPaymentSchema), asyncHandler(paymentsController.createQrisPayment));
privateRouter.get("/orders/:orderId/status", authorize(UserRole.ADMIN, UserRole.CASHIER), validateRequest(orderIdParamSchema, "params"), asyncHandler(paymentsController.getOrderPaymentStatus));

publicRouter.post("/qris", validateRequest(qrisWebhookSchema), asyncHandler(paymentsController.handleWebhook));
publicRouter.post("/qris/simulate", validateRequest(qrisWebhookSchema), asyncHandler(paymentsController.simulateWebhook));

export const paymentRoutes = {
  privateRouter,
  publicRouter,
};
