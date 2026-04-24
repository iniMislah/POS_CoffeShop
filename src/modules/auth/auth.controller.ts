import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { authService } from "./auth.service";

export const authController = {
  async login(req: Request, res: Response) {
    const result = await authService.login(req.body.email, req.body.password);
    return sendSuccess(res, result, "Login success");
  },
};
