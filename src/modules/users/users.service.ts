import bcrypt from "bcryptjs";

import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

export const usersService = {
  async getMe(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  async list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async create(payload: { name: string; email: string; password: string; role: "ADMIN" | "CASHIER" }) {
    const existingUser = await prisma.user.findUnique({
      where: { email: payload.email },
    });

    if (existingUser) {
      throw new AppError("Email already exists", 409);
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);

    return prisma.user.create({
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async update(id: string, payload: { name?: string; email?: string; password?: string; role?: "ADMIN" | "CASHIER" }) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : undefined;

    return prisma.user.update({
      where: { id },
      data: {
        name: payload.name,
        email: payload.email,
        passwordHash,
        role: payload.role,
      },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  },

  async updateMe(id: string, payload: { name?: string; email?: string; password?: string }) {
    return this.update(id, payload);
  },
};
