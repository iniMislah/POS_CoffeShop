import { z } from "zod";

export const dateRangeQuerySchema = z.object({
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  page: z.coerce.number().int().positive().max(100000).optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
});
