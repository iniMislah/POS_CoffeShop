import { UserRole } from "@prisma/client";
import { z } from "zod";

export const createUserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6),
  role: z.nativeEnum(UserRole),
});

export const updateUserSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
  role: z.nativeEnum(UserRole).optional(),
});

export const updateMeSchema = z.object({
  name: z.string().min(2).optional(),
  email: z.string().email().optional(),
  password: z.string().min(6).optional(),
});

export const userIdParamSchema = z.object({
  id: z.string().uuid(),
});
