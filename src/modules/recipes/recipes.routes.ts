import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { recipesController } from "./recipes.controller";
import { productRecipeParamSchema, recipeQuerySchema, upsertRecipeSchema } from "./recipes.validation";

export const recipeRoutes = Router();

recipeRoutes.use(authorize(UserRole.ADMIN));

recipeRoutes.get("/product/:productId", validateRequest(productRecipeParamSchema, "params"), validateRequest(recipeQuerySchema, "query"), asyncHandler(recipesController.getByProduct));
recipeRoutes.put("/product/:productId", authorize(UserRole.ADMIN), validateRequest(productRecipeParamSchema, "params"), validateRequest(upsertRecipeSchema), asyncHandler(recipesController.upsert));
recipeRoutes.get("/product/:productId/hpp", validateRequest(productRecipeParamSchema, "params"), validateRequest(recipeQuerySchema, "query"), asyncHandler(recipesController.calculateHpp));
