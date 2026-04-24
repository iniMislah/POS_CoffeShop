import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { modifiersController } from "./modifiers.controller";
import { modifierIdParamSchema, modifierSchema, updateModifierSchema } from "./modifiers.validation";

export const modifierRoutes = Router();

modifierRoutes.get("/", asyncHandler(modifiersController.list));
modifierRoutes.post("/", authorize(UserRole.ADMIN), validateRequest(modifierSchema), asyncHandler(modifiersController.create));
modifierRoutes.put("/:id", authorize(UserRole.ADMIN), validateRequest(modifierIdParamSchema, "params"), validateRequest(updateModifierSchema), asyncHandler(modifiersController.update));
modifierRoutes.delete("/:id", authorize(UserRole.ADMIN), validateRequest(modifierIdParamSchema, "params"), asyncHandler(modifiersController.remove));
