import { describe, expect, it } from "vitest"
import type { ParametrosPlanta } from "@/lib/domain"
import { calcularDia } from "@/lib/repositories/mock/plan-calculator"
import { calcularEjemplo, camposCambiados, parseConfig, toConfigInput } from "../configuracion"

const PIURA: ParametrosPlanta = {
  rendimientoPersonaHora: 5.9,
  personalMaximo: 300,
  horasJornada: 10,
  horasExtraMax: 2,
  horaInicio: "17:00",
  factorEficiencia: 0.8,
  toleranciaVolumen: 5,
}

describe("calcularEjemplo", () => {
  it("da lo mismo que el cálculo del plan para un día", () => {
    for (const p of [PIURA, { ...PIURA, personalMaximo: 200 }, { ...PIURA, factorEficiencia: 0.6 }]) {
      const ejemplo = calcularEjemplo(13_000, p)
      const dia = calcularDia({ fecha: "2026-10-16", jabas: 13_000 }, 1, p)
      expect(ejemplo.trabajadores).toBe(dia.trabajadores)
      expect(ejemplo.horas).toBeCloseTo(dia.horas)
      expect(ejemplo.margen).toBeCloseTo(dia.margen)
      expect(ejemplo.estadoDia).toBe(dia.estadoDia)
    }
  })

  it("Piura con 13,000 jabas: 47.2 jabas por persona, 276 trabajadores, +20%", () => {
    const r = calcularEjemplo(13_000, PIURA)
    expect(r.jabasPorPersona).toBeCloseTo(47.2)
    expect(r.trabajadores).toBe(276)
    expect(Math.round(r.margen * 100)).toBe(20)
    expect(r.topeAlcanzado).toBe(false)
  })

  it("marca el tope cuando se necesita más personal que el máximo", () => {
    const r = calcularEjemplo(13_000, { ...PIURA, personalMaximo: 250 })
    expect(r.topeAlcanzado).toBe(true)
    expect(r.trabajadores).toBe(250)
    expect(r.horas).toBeGreaterThan(PIURA.horasJornada)
    expect(r.estadoDia).toBe("HORAS_EXTRA")
  })
})

describe("parseConfig", () => {
  it("convierte la eficiencia de % a fracción y toma la hora de inicio", () => {
    const input = { ...toConfigInput(PIURA), factorEficiencia: "75", horaInicio: "06:30" }
    const { values } = parseConfig(input, PIURA)
    expect(values?.factorEficiencia).toBeCloseTo(0.75)
    expect(values?.horaInicio).toBe("06:30")
  })

  it("rechaza valores fuera de rango (contexto §6 PLANTA)", () => {
    const input = {
      ...toConfigInput(PIURA),
      personalMaximo: "12.5",
      horasJornada: "25",
      factorEficiencia: "5",
      horaInicio: "",
    }
    const { values, errors } = parseConfig(input, PIURA)
    expect(values).toBeNull()
    expect(Object.keys(errors).sort()).toEqual(
      ["factorEficiencia", "horaInicio", "horasJornada", "personalMaximo"].sort(),
    )
  })
})

describe("camposCambiados", () => {
  it("ignora diferencias de formato y detecta cambios reales", () => {
    const sinCambios = { ...toConfigInput(PIURA), rendimientoPersonaHora: "5.90" }
    expect(camposCambiados(sinCambios, PIURA)).toEqual([])
    const cambiado = { ...toConfigInput(PIURA), horasExtraMax: "3", horaInicio: "18:00" }
    expect(camposCambiados(cambiado, PIURA)).toEqual(["horasExtraMax", "horaInicio"])
  })

  it("cuenta un campo inválido como cambio", () => {
    const input = { ...toConfigInput(PIURA), personalMaximo: "" }
    expect(camposCambiados(input, PIURA)).toEqual(["personalMaximo"])
  })
})
