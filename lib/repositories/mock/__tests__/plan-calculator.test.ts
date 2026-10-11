import { describe, expect, it } from "vitest"
import type { ParametrosPlanta } from "@/lib/domain"
import { calcularDia, calcularPlan, repartirPorArea } from "../plan-calculator"

const PIURA: ParametrosPlanta = {
  rendimientoPersonaHora: 5.9,
  personalMaximo: 300,
  horasJornada: 10,
  horasExtraMax: 2,
  horaInicio: "17:00",
  factorEficiencia: 0.8,
  toleranciaVolumen: 5,
}

const DIA = { fecha: "2026-10-16", jabas: 13_000 }

describe("calcularDia (ejemplo Piura del contexto §4)", () => {
  it("día normal: 276 trabajadores, ~10 h, margen +20%", () => {
    const d = calcularDia(DIA, 1, PIURA)
    expect(d.jabasMeta).toBe(13_000)
    expect(d.trabajadores).toBe(276)
    expect(d.horas).toBeCloseTo(9.98, 2)
    expect(Math.round(d.margen * 100)).toBe(20)
    expect(d.estadoDia).toBe("DENTRO_JORNADA")
  })

  it("escenario +20%: 15,600 jabas, tope de 300 trabajadores, 11.0 h y requiere horas extra", () => {
    const d = calcularDia(DIA, 1.2, PIURA)
    expect(d.jabasMeta).toBeCloseTo(15_600)
    expect(d.trabajadores).toBe(300)
    expect(d.horas).toBeCloseTo(11.02, 2)
    expect(d.estadoDia).toBe("HORAS_EXTRA")
  })

  it("marca riesgo de turno extra si no alcanza jornada + horas extra", () => {
    expect(calcularDia(DIA, 1.5, PIURA).estadoDia).toBe("RIESGO_TURNO_EXTRA")
  })
})

describe("repartirPorArea", () => {
  it("las áreas suman exactamente el total", () => {
    for (const total of [1, 57, 276, 300, 1200]) {
      const sum = repartirPorArea(total).reduce((s, a) => s + a.trabajadoresPlan, 0)
      expect(sum).toBe(total)
    }
  })
})

describe("calcularPlan", () => {
  it("calcula totales en jabas y cumplimiento comercial", () => {
    const plan = calcularPlan({
      cosecha: [DIA, { ...DIA, fecha: "2026-10-15" }],
      totalComercial: 26_000,
      parametros: PIURA,
      parametrosModificados: false,
      escenarioCosecha: "PROYECTADA",
    })
    expect(plan.totales.jabasMeta).toBe(26_000)
    expect(plan.totales.trabajadoresPico).toBe(276)
    expect(plan.totales.cumplimientoComercial).toBe(1)
  })
})
