import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { ingredientsController } from "./ingredients.controller";
import { ingredientIdParamSchema, ingredientSchema, updateIngredientSchema } from "./ingredients.validation";

export const ingredientRoutes = Router();

ingredientRoutes.use(authorize(UserRole.ADMIN));

ingredientRoutes.get("/", asyncHandler(ingredientsController.list));
ingredientRoutes.post("/", authorize(UserRole.ADMIN), validateRequest(ingredientSchema), asyncHandler(ingredientsController.create));
ingredientRoutes.put("/:id", authorize(UserRole.ADMIN), validateRequest(ingredientIdParamSchema, "params"), validateRequest(updateIngredientSchema), asyncHandler(ingredientsController.update));
ingredientRoutes.delete("/:id", authorize(UserRole.ADMIN), validateRequest(ingredientIdParamSchema, "params"), asyncHandler(ingredientsController.remove));
