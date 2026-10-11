import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import { serverEnv } from "@/lib/config/env"
import { dashboardSchema } from "./schema"
import { dashboardMock } from "./mock-data"
import { getCurrentUser } from "@/lib/auth/session"
import { getRepositories } from "@/lib/repositories"
import { resolveDashboardWeek, type DashboardSearchParams } from "./week-selection"
import { mapDashboard, type DashboardResponse } from "./api-mapper"

export async function getDashboard(searchParams: DashboardSearchParams = {}) {
  if (serverEnv().API_MOCK) return dashboardSchema.parse(dashboardMock)
  const user = await getCurrentUser()
  const { year, week } = resolveDashboardWeek(searchParams)
  const [response, plants] = await Promise.all([
    apiRequest<DashboardResponse>(process.env.DASHBOARD_API_PATH || "/dashboard", {
      query: { year, week, plantId: user.plantaId ?? undefined },
    }),
    getRepositories().plantas.listar(),
  ])
  return dashboardSchema.parse(mapDashboard(response,
    user.plantaId === null ? plants : plants.filter(plant => plant.id === user.plantaId)))
}
