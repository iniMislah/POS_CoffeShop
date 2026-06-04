import { Router } from "express";

import { asyncHandler } from "../../common/async-handler";
import { validateRequest } from "../../middlewares/validate.middleware";
import { ordersController } from "./orders.controller";
import { addOrderItemSchema, checkoutOrderSchema, createDraftOrderSchema, orderIdParamSchema } from "./orders.validation";

export const orderRoutes = Router();

orderRoutes.get("/recent", asyncHandler(ordersController.listRecent));
orderRoutes.get("/", asyncHandler(ordersController.list));
orderRoutes.get("/:id/receipt-qr", validateRequest(orderIdParamSchema, "params"), asyncHandler(ordersController.getReceiptQr));
orderRoutes.get("/:id", validateRequest(orderIdParamSchema, "params"), asyncHandler(ordersController.getById));
orderRoutes.post("/", validateRequest(createDraftOrderSchema), asyncHandler(ordersController.createDraft));
orderRoutes.post("/:id/items", validateRequest(orderIdParamSchema, "params"), validateRequest(addOrderItemSchema), asyncHandler(ordersController.addItem));
orderRoutes.post("/:id/checkout", validateRequest(orderIdParamSchema, "params"), validateRequest(checkoutOrderSchema), asyncHandler(ordersController.checkout));
orderRoutes.post("/:id/cancel", validateRequest(orderIdParamSchema, "params"), asyncHandler(ordersController.cancel));
