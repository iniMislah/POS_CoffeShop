import bcrypt from "bcryptjs";
import { UserRole } from "@prisma/client";

import { AppError } from "../../common/app-error";
import { prisma } from "../../lib/prisma";

const userSelect = {
  id: true,
  name: true,
  email: true,
  role: true,
  isActive: true,
  createdAt: true,
  updatedAt: true,
} as const;

type UserRoleValue = "ADMIN" | "CASHIER";

async function ensureEmailAvailable(email: string, excludeId?: string) {
  const existingUser = await prisma.user.findUnique({
    where: { email },
    select: { id: true },
  });

  if (existingUser && existingUser.id !== excludeId) {
    throw new AppError("Email already exists", 409);
  }
}

async function ensureActiveAdminWillRemain(userId: string, nextRole: UserRoleValue, nextIsActive: boolean) {
  const existingUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      role: true,
      isActive: true,
    },
  });

  if (!existingUser) {
    throw new AppError("User not found", 404);
  }

  const currentIsProtectedAdmin = existingUser.role === UserRole.ADMIN && existingUser.isActive;
  const willRemainProtectedAdmin = nextRole === UserRole.ADMIN && nextIsActive;

  if (!currentIsProtectedAdmin || willRemainProtectedAdmin) {
    return;
  }

  const activeAdminCount = await prisma.user.count({
    where: {
      role: UserRole.ADMIN,
      isActive: true,
    },
  });

  if (activeAdminCount <= 1) {
    throw new AppError("At least one active admin must remain in the system", 400);
  }
}

export const usersService = {
  async getMe(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      select: userSelect,
    });

    if (!user) {
      throw new AppError("User not found", 404);
    }

    return user;
  },

  async list() {
    return prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      select: userSelect,
    });
  },

  async create(payload: {
    name: string;
    email: string;
    password: string;
    role: UserRoleValue;
    isActive?: boolean;
  }) {
    const email = payload.email.trim().toLowerCase();
    await ensureEmailAvailable(email);

    const passwordHash = await bcrypt.hash(payload.password, 10);

    return prisma.user.create({
      data: {
        name: payload.name.trim(),
        email,
        passwordHash,
        role: payload.role,
        isActive: payload.isActive ?? true,
      },
      select: userSelect,
    });
  },

  async update(
    id: string,
    payload: { name?: string; email?: string; role?: UserRoleValue },
    currentUserId?: string
  ) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    const email = payload.email?.trim().toLowerCase();

    if (email) {
      await ensureEmailAvailable(email, id);
    }

    const nextRole = payload.role ?? existingUser.role;
    const nextIsActive = existingUser.isActive;

    await ensureActiveAdminWillRemain(id, nextRole, nextIsActive);

    if (currentUserId === id && payload.role && payload.role !== existingUser.role) {
      const activeAdminCount = await prisma.user.count({
        where: {
          role: UserRole.ADMIN,
          isActive: true,
        },
      });

      if (existingUser.role === UserRole.ADMIN && activeAdminCount <= 1 && payload.role !== UserRole.ADMIN) {
        throw new AppError("You cannot change the role of the last active admin", 400);
      }
    }

    return prisma.user.update({
      where: { id },
      data: {
        name: payload.name?.trim(),
        email,
        role: payload.role,
      },
      select: userSelect,
    });
  },

  async updatePassword(id: string, password: string) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: { id: true },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    const passwordHash = await bcrypt.hash(password, 10);

    return prisma.user.update({
      where: { id },
      data: {
        passwordHash,
      },
      select: userSelect,
    });
  },

  async updateStatus(id: string, isActive: boolean, currentUserId: string) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        role: true,
        isActive: true,
      },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    if (currentUserId === id && !isActive) {
      throw new AppError("You cannot deactivate your own account", 400);
    }

    await ensureActiveAdminWillRemain(id, existingUser.role, isActive);

    return prisma.user.update({
      where: { id },
      data: {
        isActive,
      },
      select: userSelect,
    });
  },

  async updateMe(id: string, payload: { name?: string; email?: string; password?: string }) {
    const existingUser = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
      },
    });

    if (!existingUser) {
      throw new AppError("User not found", 404);
    }

    const email = payload.email?.trim().toLowerCase();

    if (email) {
      await ensureEmailAvailable(email, id);
    }

    const passwordHash = payload.password ? await bcrypt.hash(payload.password, 10) : undefined;

    return prisma.user.update({
      where: { id },
      data: {
        name: payload.name?.trim(),
        email,
        passwordHash,
      },
      select: userSelect,
    });
  },
};
