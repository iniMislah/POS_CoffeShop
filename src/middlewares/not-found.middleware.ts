import type { Request, Response, NextFunction } from "express";

import { AppError } from "../common/app-error";

export const notFoundMiddleware = (_req: Request, _res: Response, next: NextFunction) => {
  next(new AppError("Route not found", 404));
};
