import { z } from "zod";

export const dateRangeQuerySchema = z.object({
  startDate: z.coerce.date(),
  endDate: z.coerce.date(),
});
