import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import { serverEnv } from "@/lib/config/env"
import { dashboardSchema } from "./schema"
import { dashboardMock } from "./mock-data"

export async function getDashboard() {
  const data = serverEnv().API_MOCK
    ? dashboardMock
    : await apiRequest<unknown>(process.env.DASHBOARD_API_PATH || "/dashboard")
  return dashboardSchema.parse(data)
}
