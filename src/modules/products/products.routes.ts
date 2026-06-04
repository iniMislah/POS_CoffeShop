import { Router } from "express";
import { UserRole } from "@prisma/client";

import { asyncHandler } from "../../common/async-handler";
import { authorize } from "../../middlewares/auth.middleware";
import { validateRequest } from "../../middlewares/validate.middleware";
import { productsController } from "./products.controller";
import {
  productIdParamSchema,
  productSchema,
  updateProductSchema,
  productVariantCreateParamSchema,
  variantIdParamSchema,
  variantSchema,
} from "./products.validation";

export const productRoutes = Router();

productRoutes.get("/export", authorize(UserRole.ADMIN), asyncHandler(productsController.export));
productRoutes.get("/", asyncHandler(productsController.list));
productRoutes.get("/:id", validateRequest(productIdParamSchema, "params"), asyncHandler(productsController.getById));
productRoutes.post("/", authorize(UserRole.ADMIN), validateRequest(productSchema), asyncHandler(productsController.create));
productRoutes.put("/:id", authorize(UserRole.ADMIN), validateRequest(productIdParamSchema, "params"), validateRequest(updateProductSchema), asyncHandler(productsController.update));
productRoutes.delete("/:id", authorize(UserRole.ADMIN), validateRequest(productIdParamSchema, "params"), asyncHandler(productsController.remove));

productRoutes.post("/:productId/variants", authorize(UserRole.ADMIN), validateRequest(productVariantCreateParamSchema, "params"), validateRequest(variantSchema), asyncHandler(productsController.createVariant));
productRoutes.put("/variants/:variantId", authorize(UserRole.ADMIN), validateRequest(variantIdParamSchema, "params"), validateRequest(variantSchema.partial()), asyncHandler(productsController.updateVariant));
productRoutes.delete("/variants/:variantId", authorize(UserRole.ADMIN), validateRequest(variantIdParamSchema, "params"), asyncHandler(productsController.deleteVariant));
