import { describe, expect, it } from "vitest"
import { buildDashboard } from "../metrics"
import { dashboardMock } from "../mock-data"
import { dashboardSchema } from "../schema"

describe("dashboard", () => {
  it("reproduce los indicadores de Piura con cuatro jornadas cerradas", () => {
    const result = buildDashboard(dashboardMock.plants[0])
    expect(result.metrics.map(m => m.value)).toEqual(["94.5%", "9.7 h", "1 de 4", "72%", "5.9", "9.3%"])
  })
  it("excluye mediciones provisionales del día en curso", () => {
    const plant = structuredClone(dashboardMock.plants[0])
    Object.assign(plant.days[4], { executedCrates: 99999, hours: 20, discardPercent: 50 })
    expect(buildDashboard(plant).metrics).toEqual(buildDashboard(dashboardMock.plants[0]).metrics)
  })
  it("muestra un estado vacío cuando no hay jornadas cerradas", () => {
    const plant = structuredClone(dashboardMock.plants[0])
    plant.days.forEach(d => { d.closed = false })
    expect(buildDashboard(plant).metrics.every(m => m.value === "—")).toBe(true)
    expect(buildDashboard(plant).charts.every(c => c.summary === "Sin jornadas cerradas.")).toBe(true)
  })
  it("valida el contrato HTTP y rechaza plantas vacías", () => {
    expect(dashboardSchema.safeParse(dashboardMock).success).toBe(true)
    expect(dashboardSchema.safeParse({ ...dashboardMock, plants: [] }).success).toBe(false)
  })
})

