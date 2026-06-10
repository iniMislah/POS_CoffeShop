import fs from "fs";
import path from "path";
import type { NextFunction, Request, Response } from "express";
import multer from "multer";

import { AppError } from "../../common/app-error";

const productUploadDir = path.join(process.cwd(), "uploads", "products");

export const ensureProductUploadDir = () => {
  fs.mkdirSync(productUploadDir, { recursive: true });
};

const storage = multer.diskStorage({
  destination(_req, _file, callback) {
    ensureProductUploadDir();
    callback(null, productUploadDir);
  },
  filename(_req, file, callback) {
    const extension = path.extname(file.originalname).toLowerCase();
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1e9)}${extension}`;
    callback(null, uniqueName);
  },
});

export const productImageUpload = multer({
  storage,
  fileFilter(_req, file, callback) {
    if (!file.mimetype.startsWith("image/")) {
      return callback(new AppError("Product image must be an image file.", 422));
    }

    return callback(null, true);
  },
});

const parseJsonArrayField = (value: unknown) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmedValue = value.trim();
  if (!trimmedValue) {
    return [];
  }

  return JSON.parse(trimmedValue);
};

export const normalizeProductMultipartBody = (req: Request, _res: Response, next: NextFunction) => {
  try {
    if (!req.is("multipart/form-data")) {
      return next();
    }

    if (req.body.isAvailable === "true" || req.body.isAvailable === "false") {
      req.body.isAvailable = req.body.isAvailable === "true";
    }

    req.body.variants = parseJsonArrayField(req.body.variants);
    req.body.modifiers = parseJsonArrayField(req.body.modifiers);

    return next();
  } catch {
    return next(new AppError("Invalid product multipart payload.", 422));
  }
};
