import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { usersController } from "./users.controller";
import {
  createUserSchema,
  updateMeSchema,
  updateUserPasswordSchema,
  updateUserSchema,
  updateUserStatusSchema,
  userIdParamSchema,
} from "./users.validation";

export const userRoutes = Router();

userRoutes.get("/me", asyncHandler(usersController.me));
userRoutes.patch("/me", validateRequest(updateMeSchema), asyncHandler(usersController.updateMe));
userRoutes.get("/", authorize(UserRole.ADMIN), asyncHandler(usersController.list));
userRoutes.post("/", authorize(UserRole.ADMIN), validateRequest(createUserSchema), asyncHandler(usersController.create));
userRoutes.put("/:id", authorize(UserRole.ADMIN), validateRequest(userIdParamSchema, "params"), validateRequest(updateUserSchema), asyncHandler(usersController.update));
userRoutes.patch("/:id/password", authorize(UserRole.ADMIN), validateRequest(userIdParamSchema, "params"), validateRequest(updateUserPasswordSchema), asyncHandler(usersController.updatePassword));
userRoutes.patch("/:id/status", authorize(UserRole.ADMIN), validateRequest(userIdParamSchema, "params"), validateRequest(updateUserStatusSchema), asyncHandler(usersController.updateStatus));
