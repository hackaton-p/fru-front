import { describe, expect, it } from "vitest"
import { buildDashboard } from "../metrics"
import { dashboardMock } from "../mock-data"
import { dashboardSchema } from "../schema"
import { mapDashboard } from "../api-mapper"

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
    expect(buildDashboard(plant).metrics.map(m => m.value)).toEqual(["0.0%", "0.0 h", "0 de 0", "0%", "0.0", "0.0%"])
    expect(buildDashboard(plant).insights.length).toBe(3)
  })
  it("valida el contrato HTTP y rechaza plantas vacías", () => {
    expect(dashboardSchema.safeParse(dashboardMock).success).toBe(true)
    expect(dashboardSchema.safeParse({ ...dashboardMock, plants: [] }).success).toBe(false)
  })
  it("conserva todas las secciones en cero cuando el backend no tiene planificación", () => {
    const data = mapDashboard({ year: 2026, week: 41, days: [] }, [{
      id: 1, nombre: "Piura", horasJornada: 10, rendimientoPersonaHora: 5.9,
      personalMaximo: 300, horasExtraMax: 2, horaInicio: "07:00",
      factorEficiencia: 0.8, toleranciaVolumen: 5,
    }])
    expect(dashboardSchema.safeParse(data).success).toBe(true)
    const plant = data.plants[0]
    expect(plant.hasPlan).toBe(false)
    expect(plant.days.length).toBe(7)
    expect(plant.weeklyFlow).toEqual({ plannedCrates: 0, arrivedCrates: 0 })
    const result = buildDashboard(plant)
    expect(result.metrics.length).toBe(6)
    expect(result.charts.length).toBe(6)
    expect(result.charts.every(chart => chart.series.every(series => series.values.every(value => value === 0)))).toBe(true)
  })
})

