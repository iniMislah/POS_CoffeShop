import { UserRole } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole).default(UserRole.CASHIER),
  isActive: z.boolean().optional(),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const updateUserPasswordSchema = z.object({
  password: z.string().min(6),
});

export const updateUserStatusSchema = z.object({
  isActive: z.boolean(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});
