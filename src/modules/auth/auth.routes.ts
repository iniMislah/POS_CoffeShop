import { Router } from "express";

import { asyncHandler } from "../../common/async-handler";
import { validateRequest } from "../../middlewares/validate.middleware";
import { authController } from "./auth.controller";
import { loginSchema } from "./auth.validation";

export const authRoutes = Router();

authRoutes.post("/login", validateRequest(loginSchema), asyncHandler(authController.login));
