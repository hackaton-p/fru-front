import { describe, expect, it } from "vitest"
import { planesSemilla, ULTIMO_ID_SEMILLA } from "../planes-semilla"

const HOY = new Date("2026-10-10T23:00:00Z")

describe("planesSemilla", () => {
  const planes = planesSemilla(HOY)

  it("no siembra la semana 42 de Piura: la crea el planificador", () => {
    expect(planes.some((p) => p.plantaId === 1 && p.semana === 42)).toBe(false)
  })

  it("un plan por planta, fruta y semana, con IDs únicos", () => {
    const claves = planes.map((p) => `${p.plantaId}-${p.frutaId}-${p.semana}`)
    expect(new Set(claves).size).toBe(planes.length)
    expect(Math.max(...planes.map((p) => p.id))).toBe(ULTIMO_ID_SEMILLA)
  })

  it("Sullana sem 42 queda pendiente, sin aprobación", () => {
    const s42 = planes.find((p) => p.plantaId === 2 && p.semana === 42)!
    expect(s42.estado).toBe("PENDIENTE")
    expect(s42.fechaAprobacion).toBeNull()
    expect(s42.parametrosUsados.factorEficiencia).toBe(0.85)
    expect(s42.dias[0].fecha).toBe("2026-10-12")
  })

  it("Piura sem 41 guarda el personal máximo cambiado (290) como valor final", () => {
    const p41 = planes.find((p) => p.plantaId === 1 && p.semana === 41)!
    expect(p41.estado).toBe("EN_EJECUCION")
    expect(p41.parametrosUsados.personalMaximo).toBe(290)
    expect(p41.parametrosModificados).toBe(true)
    expect(p41.fechaAprobacion?.slice(0, 10)).toBe("2026-10-02")
  })
})
