import { describe, expect, it } from "vitest"
import { dashboardWeekOptions, resolveDashboardWeek } from "../week-selection"

const now = new Date("2026-10-11T12:00:00Z")

describe("Dashboard week selection", () => {
  it("selects the period of the December test workday", () => {
    expect(resolveDashboardWeek({ anio: "2026", semana: "51" }, now)).toEqual({ year: 2026, week: 51 })
    expect(dashboardWeekOptions(2026)[50]).toEqual({ value: "2026-51", label: "Semana 51 · 14/12/2026 al 20/12/2026" })
  })

  it("includes week 53 only in years that have it", () => {
    expect(dashboardWeekOptions(2026).length).toBe(53)
    expect(dashboardWeekOptions(2027).length).toBe(52)
    expect(resolveDashboardWeek({ anio: "2027", semana: "53" }, now)).toEqual({ year: 2026, week: 41 })
  })

  it("labels dates that cross the year boundary", () => {
    expect(dashboardWeekOptions(2026)[52].label).toBe("Semana 53 · 28/12/2026 al 03/01/2027")
  })

  it("uses the current week in Lima, even after UTC has reached Monday", () => {
    expect(resolveDashboardWeek({}, new Date("2026-10-12T02:00:00Z"))).toEqual({ year: 2026, week: 41 })
  })

  it.each([{ semana: "0" }, { semana: "abc" }, { anio: "0", semana: "1" }, { semana: ["41", "51"] }])("rejects invalid query parameters (%j)", params => {
    expect(resolveDashboardWeek(params, now)).toEqual({ year: 2026, week: 41 })
  })
})
