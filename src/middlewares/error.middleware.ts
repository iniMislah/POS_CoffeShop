import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";

import { AppError } from "../common/app-error";

export const errorMiddleware = (error: unknown, _req: Request, res: Response, _next: NextFunction) => {
  if (error instanceof ZodError) {
    return res.status(422).json({
      success: false,
      message: "Validation failed",
      errors: error.flatten(),
    });
  }

  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      success: false,
      message: error.message,
      errors: error.details ?? null,
    });
  }

  if (error instanceof Error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
