import { z } from "zod";

export const categorySchema = z.object({
  name: z.string().min(2),
});

export const categoryIdParamSchema = z.object({
  id: z.string().uuid(),
});
