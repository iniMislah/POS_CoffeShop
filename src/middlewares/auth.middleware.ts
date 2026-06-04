import type { NextFunction, Request, Response } from "express";
import { UserRole } from "@prisma/client";

import { AppError } from "../common/app-error";
import { verifyAccessToken } from "../common/jwt";
import { prisma } from "../lib/prisma";

export const authenticate = async (req: Request, _res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    return next(new AppError("Unauthorized", 401));
  }

  const token = authHeader.replace("Bearer ", "");

  try {
    const payload = verifyAccessToken(token);
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: {
        id: true,
        email: true,
        role: true,
        isActive: true,
      },
    });

    if (!user || !user.isActive) {
      return next(new AppError("Unauthorized", 401));
    }

    req.user = {
      id: user.id,
      email: user.email,
      role: user.role as UserRole,
    };
    return next();
  } catch {
    return next(new AppError("Invalid or expired token", 401));
  }
};

export const authorize =
  (...roles: UserRole[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(new AppError("Unauthorized", 401));
    }

    if (!roles.includes(req.user.role)) {
      return next(new AppError("Forbidden", 403));
    }

    return next();
  };
