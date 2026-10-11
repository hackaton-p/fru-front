import { z } from "zod"

const measurement = z.number().nonnegative().nullable()
export const dashboardSchema = z.object({
  week: z.number().int().positive(),
  period: z.string(),
  source: z.string(),
  plants: z.array(z.object({
    id: z.string(), name: z.string(), label: z.string(),
    shiftHours: z.number().positive(), defaultYield: z.number().positive(),
    days: z.array(z.object({
      label: z.string(), closed: z.boolean(),
      projectedCrates: z.number().nonnegative(), executedCrates: measurement,
      hours: measurement, projectedStaff: z.number().nonnegative(),
      executedStaff: measurement, discardPercent: measurement,
    })).min(1),
  })).min(1),
})

export type DashboardData = z.infer<typeof dashboardSchema>
export type DashboardPlant = DashboardData["plants"][number]
