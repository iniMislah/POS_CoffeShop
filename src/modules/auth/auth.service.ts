import bcrypt from "bcryptjs";

import { AppError } from "../../common/app-error";
import { signAccessToken } from "../../common/jwt";
import { prisma } from "../../lib/prisma";

export const authService = {
  async login(email: string, password: string) {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new AppError("Invalid email or password", 401);
    }

    if (!user.isActive) {
      throw new AppError("User account is inactive. Please contact admin.", 403);
    }

    const passwordMatched = await bcrypt.compare(password, user.passwordHash);

    if (!passwordMatched) {
      throw new AppError("Invalid email or password", 401);
    }

    const accessToken = signAccessToken({
      sub: user.id,
      email: user.email,
      role: user.role,
    });

    return {
      accessToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    };
  },
};
