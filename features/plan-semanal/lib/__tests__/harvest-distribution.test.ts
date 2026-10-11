import { describe, expect, it } from "vitest"
import { distributeHarvest } from "../harvest-distribution"

describe("Distribución de cosecha", () => {
  it("distribuye entre siete días sin perder jabas por redondeo", () => {
    const days = distributeHarvest(100)
    expect(days.length).toBe(7)
    expect(days.reduce((sum, day) => sum + Math.round(day * 100), 0)).toBe(10000)
    expect(Math.max(...days) - Math.min(...days) < 0.011).toBe(true)
  })
  it("conserva un total con decimales", () => {
    expect(distributeHarvest(0.03)).toEqual([0.01, 0.01, 0.01, 0, 0, 0, 0])
  })
  it("permite un total cero", () => {
    expect(distributeHarvest(0)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
})
