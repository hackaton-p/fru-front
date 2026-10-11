import { expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/config/env", () => ({ serverEnv: () => ({ API_MOCK: false }) }))
vi.mock("@/lib/auth/session", () => ({ getCurrentUser: async () => ({ plantaId: 1 }) }))
vi.mock("@/lib/repositories", () => ({ getRepositories: () => ({ plantas: { listar: async () => [{
  id: 1, nombre: "Piura", horasJornada: 10, rendimientoPersonaHora: 5.9,
}] } }) }))
const request = vi.hoisted(() => vi.fn())
vi.mock("@/lib/api/http-client", () => ({ apiRequest: request }))
import { getDashboard } from "../queries"

it("requests and displays the selected week with its workday progress", async () => {
  request.mockResolvedValue({ year: 2026, week: 51, days: [{
    plantId: 1, date: "2026-12-14", targetCrates: "12000", plannedWorkers: 170,
    workday: { closedAt: null, processedCrates: "5000", receivedCrates: "5000",
      workedHours: null, presentWorkers: 170, discardedCrates: null },
  }] })
  const data = await getDashboard({ anio: "2026", semana: "51" })
  expect(request).toHaveBeenCalledWith(expect.any(String), {
    query: { year: 2026, week: 51, plantId: 1 },
  })
  expect(data.period).toBe("14/12 al 20/12")
  expect(data.plants[0].days[0].executedCrates).toBe(5000)
  expect(data.plants[0].days[0].closed).toBe(false)
})
