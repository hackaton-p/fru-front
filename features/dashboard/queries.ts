import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import { serverEnv } from "@/lib/config/env"
import { dashboardSchema } from "./schema"
import { dashboardMock } from "./mock-data"
import { getCurrentUser } from "@/lib/auth/session"
import { getRepositories } from "@/lib/repositories"
import { isoWeek } from "@/lib/dates"
import { mapDashboard, type DashboardResponse } from "./api-mapper"

export async function getDashboard() {
  if (serverEnv().API_MOCK) return dashboardSchema.parse(dashboardMock)
  const user = await getCurrentUser()
  const { year, week } = isoWeek(new Date())
  const [response, plants] = await Promise.all([
    apiRequest<DashboardResponse>(process.env.DASHBOARD_API_PATH || "/dashboard", {
      query: { year, week, plantId: user.plantaId ?? undefined },
    }),
    getRepositories().plantas.listar(),
  ])
  return dashboardSchema.parse(mapDashboard(response,
    user.plantaId === null ? plants : plants.filter(plant => plant.id === user.plantaId)))
}
