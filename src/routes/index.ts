import { Router } from "express";

import { authenticate } from "../middlewares/auth.middleware";
import { authRoutes } from "../modules/auth/auth.routes";
import { userRoutes } from "../modules/users/users.routes";
import { categoryRoutes } from "../modules/categories/categories.routes";
import { productRoutes } from "../modules/products/products.routes";
import { modifierRoutes } from "../modules/modifiers/modifiers.routes";
import { ingredientRoutes } from "../modules/ingredients/ingredients.routes";
import { recipeRoutes } from "../modules/recipes/recipes.routes";
import { inventoryRoutes } from "../modules/inventory/inventory.routes";
import { orderRoutes } from "../modules/orders/orders.routes";
import { paymentRoutes } from "../modules/payments/payments.routes";
import { receiptRoutes } from "../modules/receipts/receipts.routes";
import { reportRoutes } from "../modules/reports/reports.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/payments/webhooks", paymentRoutes.publicRouter);
apiRouter.use("/receipts/public", receiptRoutes.publicRouter);

apiRouter.use(authenticate);

apiRouter.use("/users", userRoutes);
apiRouter.use("/categories", categoryRoutes);
apiRouter.use("/products", productRoutes);
apiRouter.use("/modifiers", modifierRoutes);
apiRouter.use("/ingredients", ingredientRoutes);
apiRouter.use("/recipes", recipeRoutes);
apiRouter.use("/inventory", inventoryRoutes);
apiRouter.use("/orders", orderRoutes);
apiRouter.use("/payments", paymentRoutes.privateRouter);
apiRouter.use("/receipts", receiptRoutes.privateRouter);
apiRouter.use("/reports", reportRoutes);
