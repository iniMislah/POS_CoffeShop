import type { Request, Response } from "express";

import { sendSuccess } from "../../common/response";
import { customersService } from "./customers.service";

export const customersController = {
  async list(req: Request, res: Response) {
    const query = typeof req.query.q === "string" ? req.query.q : undefined;
    return sendSuccess(res, await customersService.list(query));
  },

  async getById(req: Request, res: Response) {
    return sendSuccess(res, await customersService.getById(req.params.id));
  },

  async create(req: Request, res: Response) {
    return sendSuccess(res, await customersService.create(req.body), "Customer created", 201);
  },

  async update(req: Request, res: Response) {
    return sendSuccess(res, await customersService.update(req.params.id, req.body), "Customer updated");
  },

  async export(req: Request, res: Response) {
    const buffer = await customersService.exportCustomers();
    const currentDate = new Date().toISOString().slice(0, 10);

    res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
    res.setHeader("Content-Disposition", `attachment; filename=\"coffee-shop-customers-${currentDate}.xlsx\"`);
    return res.send(Buffer.from(buffer));
  },
};
