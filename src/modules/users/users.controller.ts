import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { usersService } from "./users.service";

export const usersController = {
  async me(req: Request, res: Response) {
    const result = await usersService.getMe(req.user!.id);
    return sendSuccess(res, result);
  },

  async list(_req: Request, res: Response) {
    const result = await usersService.list();
    return sendSuccess(res, result);
  },

  async create(req: Request, res: Response) {
    const result = await usersService.create(req.body);
    return sendSuccess(res, result, "User created", 201);
  },

  async update(req: Request, res: Response) {
    const result = await usersService.update(req.params.id, req.body, req.user!.id);
    return sendSuccess(res, result, "User updated");
  },

  async updatePassword(req: Request, res: Response) {
    const result = await usersService.updatePassword(req.params.id, req.body.password);
    return sendSuccess(res, result, "Password updated");
  },

  async updateStatus(req: Request, res: Response) {
    const result = await usersService.updateStatus(req.params.id, req.body.isActive, req.user!.id);
    return sendSuccess(res, result, "User status updated");
  },

  async updateMe(req: Request, res: Response) {
    const result = await usersService.updateMe(req.user!.id, req.body);
    return sendSuccess(res, result, "Profile updated");
  },
};
