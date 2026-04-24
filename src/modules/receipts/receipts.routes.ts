import { Router } from "express";
import { z } from "zod";

import { asyncHandler } from "../../common/async-handler";
import { validateRequest } from "../../middlewares/validate.middleware";
import { receiptsController } from "./receipts.controller";

const publicRouter = Router();
const privateRouter = Router();

const tokenParamSchema = z.object({
  token: z.string().min(10),
});

publicRouter.get("/:token", validateRequest(tokenParamSchema, "params"), asyncHandler(receiptsController.getPublicReceipt));

export const receiptRoutes = {
  publicRouter,
  privateRouter,
};
