import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { Prisma } from "@prisma/client";
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

  if (error instanceof multer.MulterError) {
    return res.status(400).json({
      success: false,
      message: error.code === "LIMIT_FILE_SIZE" ? "Ukuran gambar terlalu besar. Maksimal 1 MB." : "Invalid upload request.",
      errors: null,
    });
  }

  if (error instanceof Prisma.PrismaClientKnownRequestError) {
    if (error.code === "P2002") {
      return res.status(409).json({
        success: false,
        message: "A record with the same unique value already exists.",
        errors: error.meta ?? null,
      });
    }

    if (error.code === "P2025") {
      return res.status(404).json({
        success: false,
        message: "Requested record was not found.",
        errors: error.meta ?? null,
      });
    }
  }

  if (error instanceof Error) {
    console.error(error);

    return res.status(500).json({
      success: false,
      message: process.env.NODE_ENV === "production" ? "Internal server error" : error.message,
    });
  }

  console.error(error);

  return res.status(500).json({
    success: false,
    message: "Internal server error",
  });
};
