import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { customersController } from "./customers.controller";
import { customerIdParamSchema, customerQuerySchema, customerSchema, updateCustomerSchema } from "./customers.validation";

export const customerRoutes = Router();

customerRoutes.get("/", authorize(UserRole.ADMIN, UserRole.CASHIER), validateRequest(customerQuerySchema, "query"), asyncHandler(customersController.list));
customerRoutes.get("/export", authorize(UserRole.ADMIN), asyncHandler(customersController.export));
customerRoutes.get("/:id", authorize(UserRole.ADMIN), validateRequest(customerIdParamSchema, "params"), asyncHandler(customersController.getById));
customerRoutes.post("/", authorize(UserRole.ADMIN, UserRole.CASHIER), validateRequest(customerSchema), asyncHandler(customersController.create));
customerRoutes.put("/:id", authorize(UserRole.ADMIN), validateRequest(customerIdParamSchema, "params"), validateRequest(updateCustomerSchema), asyncHandler(customersController.update));
