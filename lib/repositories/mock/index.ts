import "server-only"
import { ApiError } from "@/lib/api/errors"
import type { CalcularPlanInput, Plan, PlanCalculado, SemanaQuery } from "@/lib/domain"
import type { Repositories } from "../types"
import { comercialMock, cosechaMock, FRUTAS, PLANTAS } from "./data"
import { calcularPlan } from "./plan-calculator"

/*
 * Repositorios en memoria para trabajar sin el API (API_MOCK=true).
 * Simulan latencia y las reglas de transición del back (409).
 */

const LATENCIA_MS = 300
const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCIA_MS))

// Sobrevive al hot reload en desarrollo.
const store = globalThis as unknown as { __mockPlanes?: Map<string, Plan>; __mockPlanId?: number }
const planes = (store.__mockPlanes ??= new Map<string, Plan>())
const key = (q: SemanaQuery) => `${q.plantaId}-${q.frutaId}-${q.semana}`

function plantaOrThrow(id: number) {
  const planta = PLANTAS.find((p) => p.id === id)
  if (!planta) throw new ApiError("Planta no encontrada", 404)
  return planta
}

const EDITABLES = [
  "rendimientoPersonaHora",
  "personalMaximo",
  "horasJornada",
  "horasExtraMax",
  "factorEficiencia",
  "toleranciaVolumen",
] as const

function calcular(input: CalcularPlanInput): PlanCalculado {
  const planta = plantaOrThrow(input.plantaId)
  return calcularPlan({
    cosecha: cosechaMock(input.plantaId, input.semana),
    totalComercial: comercialMock(input.plantaId).reduce((s, c) => s + c.jabas, 0),
    parametros: input.parametros,
    parametrosModificados: EDITABLES.some((k) => input.parametros[k] !== planta[k]),
    escenarioCosecha: input.escenarioCosecha,
  })
}

export const mockRepositories: Repositories = {
  plantas: {
    async getById(id) {
      await delay()
      return plantaOrThrow(id)
    },
  },
  frutas: {
    async getById(id) {
      const fruta = FRUTAS.find((f) => f.id === id)
      if (!fruta) throw new ApiError("Fruta no encontrada", 404)
      return fruta
    },
  },
  proyecciones: {
    async getCosecha(q) {
      await delay()
      return cosechaMock(q.plantaId, q.semana)
    },
    async getComercial(q) {
      await delay()
      return comercialMock(q.plantaId)
    },
    async importar({ archivo }) {
      await delay()
      if (!archivo.size) throw new ApiError("El archivo está vacío.", 400)
      // El mock no procesa el Excel: los datos de ejemplo no cambian.
      return { registros: 0 }
    },
  },
  planes: {
    async getVigente(q) {
      await delay()
      return planes.get(key(q)) ?? null
    },
    async simular(input) {
      await delay()
      return calcular(input)
    },
    async aplicar(input) {
      await delay()
      const actual = planes.get(key(input))
      if (actual && actual.estado !== "BORRADOR" && actual.estado !== "RECHAZADO") {
        throw new ApiError("El plan de esta semana ya fue enviado y no se puede reemplazar.", 409)
      }
      store.__mockPlanId = (store.__mockPlanId ?? 0) + 1
      const plan: Plan = {
        ...calcular(input),
        id: actual?.id ?? store.__mockPlanId,
        plantaId: input.plantaId,
        frutaId: input.frutaId,
        semana: input.semana,
        estado: "BORRADOR",
        updatedAt: new Date().toISOString(),
        fechaEnvio: null,
        comentarioAprobacion: null,
      }
      planes.set(key(input), plan)
      return plan
    },
    async enviar(planId) {
      await delay()
      const plan = [...planes.values()].find((p) => p.id === planId)
      if (!plan) throw new ApiError("Plan no encontrado", 404)
      if (plan.estado !== "BORRADOR") {
        throw new ApiError("Solo se puede enviar un plan en borrador.", 409)
      }
      const enviado: Plan = { ...plan, estado: "PENDIENTE", fechaEnvio: new Date().toISOString() }
      planes.set(key(plan), enviado)
      return enviado
    },
  },
}
