import type { NextFunction, Request, Response } from "express";
import type { ZodTypeAny } from "zod";

export const validateRequest =
  (schema: ZodTypeAny, source: "body" | "query" | "params" = "body") =>
  (req: Request, _res: Response, next: NextFunction) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      return next(result.error);
    }

    (req as Request & Record<string, unknown>)[source] = result.data;
    return next();
  };
