import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { categoriesController } from "./categories.controller";
import { categoryIdParamSchema, categorySchema } from "./categories.validation";

export const categoryRoutes = Router();

categoryRoutes.get("/", asyncHandler(categoriesController.list));
categoryRoutes.post("/", authorize(UserRole.ADMIN), validateRequest(categorySchema), asyncHandler(categoriesController.create));
categoryRoutes.put("/:id", authorize(UserRole.ADMIN), validateRequest(categoryIdParamSchema, "params"), validateRequest(categorySchema), asyncHandler(categoriesController.update));
categoryRoutes.delete("/:id", authorize(UserRole.ADMIN), validateRequest(categoryIdParamSchema, "params"), asyncHandler(categoriesController.remove));
