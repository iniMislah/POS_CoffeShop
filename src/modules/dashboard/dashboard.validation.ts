import { z } from "zod";

const normalizePeriod = (value: unknown) => {
  if (value === "last-6-months" || value === "last-1-year") {
    return "all-time";
  }

  return value;
};

export const dashboardPeriodSchema = z.object({
  period: z.preprocess(
    normalizePeriod,
    z.enum(["today", "last-1-week", "last-1-month", "last-3-months", "all-time"]).optional().default("today"),
  ),
});

export type DashboardPeriod = z.infer<typeof dashboardPeriodSchema>["period"];
