import { describe, expect, it } from "vitest"
import type { ParametrosPlanta, Plan } from "@/lib/domain"
import { parametrosDistintos, parseParametros, toInput } from "@/lib/parametros"
import { calcularBrecha } from "../brecha"
import { estadoCambios } from "../plan-comparator"

const DEFAULTS: ParametrosPlanta = {
  rendimientoPersonaHora: 5.9,
  personalMaximo: 300,
  horasJornada: 10,
  horasExtraMax: 2,
  horaInicio: "17:00",
  factorEficiencia: 0.8,
  toleranciaVolumen: 5,
}

function planCon(parcial: Partial<Plan>): Plan {
  return {
    id: 1,
    plantaId: 1,
    frutaId: 1,
    semana: 42,
    estado: "BORRADOR",
    updatedAt: "2026-10-10T12:00:00Z",
    escenarioCosecha: "PROYECTADA",
    parametrosUsados: DEFAULTS,
    parametrosModificados: false,
    dias: [],
    totales: {
      jabasMeta: 0,
      trabajadoresPico: 0,
      trabajadoresPromedio: 0,
      horasTotal: 0,
      horasPromedio: 0,
      cumplimientoComercial: 1,
    },
    ...parcial,
  }
}

describe("calcularBrecha", () => {
  it("ejemplo del contexto: faltan 2,400 jabas (3.8%)", () => {
    const b = calcularBrecha(60_000, 62_400)
    expect(b.hayBrecha).toBe(true)
    expect(b.jabas).toBe(2_400)
    expect(b.porcentaje).toBeCloseTo(0.0385, 4)
  })

  it("sin brecha si la cosecha cubre el programa", () => {
    expect(calcularBrecha(63_000, 62_400).hayBrecha).toBe(false)
  })
})

describe("parámetros del plan", () => {
  it("los inputs arrancan con los defaults y vuelven a los mismos valores", () => {
    const input = toInput(DEFAULTS)
    expect(input.factorEficiencia).toBe("80")
    expect(parseParametros(input, DEFAULTS).values).toEqual(DEFAULTS)
  })

  it("convierte la eficiencia de % a fracción y detecta lo que difiere del default", () => {
    const { values } = parseParametros({ ...toInput(DEFAULTS), factorEficiencia: "85" }, DEFAULTS)
    expect(values?.factorEficiencia).toBe(0.85)
    expect(parametrosDistintos(values!, DEFAULTS)).toEqual(["factorEficiencia"])
  })

  it("valida rangos y obligatorios", () => {
    const { values, errors } = parseParametros(
      { ...toInput(DEFAULTS), horasJornada: "30", personalMaximo: "12.5", toleranciaVolumen: "" },
      DEFAULTS,
    )
    expect(values).toBeNull()
    expect(errors.horasJornada).toBe("Máximo 24")
    expect(errors.personalMaximo).toBeDefined()
    expect(errors.toleranciaVolumen).toBe("Campo obligatorio")
  })
})

describe("estadoCambios", () => {
  const sim = { escenario: "PROYECTADA" as const, parametros: DEFAULTS }

  it("sin plan oficial", () => {
    expect(estadoCambios(sim, null)).toBe("SIN_PLAN")
  })

  it("igual cuando escenario y valores finales coinciden", () => {
    expect(estadoCambios(sim, planCon({}))).toBe("IGUAL")
  })

  it("con cambios si cambia el escenario o un valor", () => {
    expect(estadoCambios({ ...sim, escenario: "+10" }, planCon({}))).toBe("CON_CAMBIOS")
    expect(
      estadoCambios({ ...sim, parametros: { ...DEFAULTS, factorEficiencia: 0.85 } }, planCon({})),
    ).toBe("CON_CAMBIOS")
  })

  it("con cambios si hay parámetros inválidos", () => {
    expect(estadoCambios({ ...sim, parametros: null }, planCon({}))).toBe("CON_CAMBIOS")
  })

  it("bloqueado si el plan ya fue enviado", () => {
    expect(estadoCambios(sim, planCon({ estado: "PENDIENTE" }))).toBe("BLOQUEADO")
  })
})
