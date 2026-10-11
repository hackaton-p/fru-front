import { describe, expect, it } from "vitest"
import { distributeHarvest } from "../harvest-distribution"

describe("Distribución de cosecha", () => {
  it("usa cinco días cuando el período de planificación lo indica", () => {
    expect(distributeHarvest(100, 5)).toEqual([20, 20, 20, 20, 20])
  })
  it("distribuye entre siete días sin perder jabas y usando enteros", () => {
    const days = distributeHarvest(100)
    expect(days.length).toBe(7)
    expect(days.reduce((sum, day) => sum + day, 0)).toBe(100)
    expect(days.every(Number.isInteger)).toBe(true)
    expect(Math.max(...days) - Math.min(...days)).toBeLessThanOrEqual(1)
  })
  it("distribuye el resto y permite días con cero", () => {
    expect(distributeHarvest(100, 3)).toEqual([34, 33, 33])
    expect(distributeHarvest(2, 6)).toEqual([1, 1, 0, 0, 0, 0])
  })
  it("rechaza totales fraccionarios y cantidades inválidas", () => {
    expect(() => distributeHarvest(0.03)).toThrow(RangeError)
    expect(() => distributeHarvest(-1)).toThrow(RangeError)
    expect(() => distributeHarvest(100, 0)).toThrow(RangeError)
  })
  it("permite un total cero", () => {
    expect(distributeHarvest(0)).toEqual([0, 0, 0, 0, 0, 0, 0])
  })
})
