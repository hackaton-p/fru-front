import { describe, expect, it } from "vitest"
import type { EstimacionJornada, ParametrosPlanta } from "@/lib/domain"
import {
  clasificarHoras,
  horaFin,
  horasConTrabajadores,
  personasAdicionales,
  trabajadoresParaHoras,
} from "../jornada"

const PIURA: ParametrosPlanta = {
  rendimientoPersonaHora: 5.9,
  personalMaximo: 300,
  horasJornada: 10,
  horasExtraMax: 2,
  horaInicio: "17:00",
  factorEficiencia: 0.8,
  toleranciaVolumen: 5,
}

describe("estimado al iniciar (contexto §4)", () => {
  it("186 trabajadores para 13,000 jabas: ~14.8 h, riesgo de turno extra", () => {
    const h = horasConTrabajadores(13_000, 186, PIURA)
    expect(h).toBeCloseTo(14.8, 1)
    expect(clasificarHoras(h, 9.98, PIURA)).toBe("RIESGO_TURNO_EXTRA")
  })

  it("con 261 trabajadores requiere horas extra; con 276 queda en plan", () => {
    expect(clasificarHoras(horasConTrabajadores(13_000, 261, PIURA), 9.98, PIURA)).toBe("HORAS_EXTRA")
    expect(clasificarHoras(horasConTrabajadores(13_000, 276, PIURA), 9.98, PIURA)).toBe("EN_PLAN")
  })

  it("para terminar en 10 h hacen falta 276 trabajadores", () => {
    expect(trabajadoresParaHoras(13_000, 10, PIURA)).toBe(276)
  })

  it("sin trabajadores no hay estimado", () => {
    expect(horasConTrabajadores(13_000, 0, PIURA)).toBe(Number.POSITIVE_INFINITY)
  })
})

describe("horaFin", () => {
  it("cruza la medianoche", () => {
    expect(horaFin("17:00", 10)).toBe("03:00")
    expect(horaFin("17:00", 10.6)).toBe("03:36")
    expect(horaFin("17:00", 2)).toBe("19:00")
  })
})

describe("personasAdicionales", () => {
  const est: EstimacionJornada = {
    horasTranscurridas: 2,
    trabajadoresPresentes: 250,
    jabasProcesadas: 2_000,
    volumenDia: 13_000,
    productividad: 4,
    ritmoReal: true,
    pendiente: 11_000,
    horasEstimadas: 13,
    motivoSugerido: "PERSONAL_PRESENTE",
  }

  it("calcula cuántas personas más se necesitan para terminar a tiempo", () => {
    // 11,000 jabas en 8 h a 4 jabas/persona-h → 344 personas; hay 250.
    expect(personasAdicionales(est, 10)).toBe(94)
  })

  it("null si ya no queda tiempo para el objetivo", () => {
    expect(personasAdicionales(est, 2)).toBeNull()
  })
})
