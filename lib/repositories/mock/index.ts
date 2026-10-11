import "server-only"
import { ApiError } from "@/lib/api/errors"
import type { CalcularPlanInput, Plan, PlanCalculado, SemanaQuery } from "@/lib/domain"
import type { Repositories } from "../types"
import { cursoMock } from "./curso-data"
import { comercialMock, cosechaMock, FRUTAS, PLANTAS } from "./data"
import { crearJornadasMock, type JornadasStore } from "./jornadas"
import { calcularPlan } from "./plan-calculator"
import { planesSemilla, ULTIMO_ID_SEMILLA } from "./planes-semilla"

/*
 * Repositorios en memoria para trabajar sin el API (API_MOCK=true).
 * Simulan latencia y las reglas de transición del back (409).
 */

const LATENCIA_MS = 300
const delay = () => new Promise((resolve) => setTimeout(resolve, LATENCIA_MS))

const key = (q: SemanaQuery) => `${q.plantaId}-${q.frutaId}-${q.semana}`

// Sobrevive al hot reload en desarrollo. Arranca con los planes de ejemplo.
const store = globalThis as unknown as {
  __mockPlanes?: Map<string, Plan>
  __mockPlanId?: number
  __mockJornadas?: JornadasStore
}
const planes = (store.__mockPlanes ??= new Map(planesSemilla().map((p) => [key(p), p])))
store.__mockPlanId ??= ULTIMO_ID_SEMILLA
const jornadas = crearJornadasMock(
  planes,
  (store.__mockJornadas ??= { jornadas: new Map(), ultimoId: 0 }),
  delay,
)

/** Solo demo (API_MOCK): borra la última jornada de la planta para repetir el flujo. */
export const reiniciarJornadaDemo = jornadas.reiniciarDemo

function planOrThrow(id: number) {
  const plan = [...planes.values()].find((p) => p.id === id)
  if (!plan) throw new ApiError("Plan no encontrado", 404)
  return plan
}

/** Aplica una transición de estado si el plan está pendiente (si no, 409 como el back). */
function decidir(id: number, cambios: Pick<Plan, "estado" | "comentarioAprobacion">): Plan {
  const plan = planOrThrow(id)
  if (plan.estado !== "PENDIENTE") {
    throw new ApiError("Solo se puede aprobar o rechazar un plan pendiente.", 409)
  }
  const ahora = new Date().toISOString()
  const decidido: Plan = { ...plan, ...cambios, fechaAprobacion: ahora, updatedAt: ahora }
  planes.set(key(plan), decidido)
  return decidido
}

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
    async listar() {
      await delay()
      return PLANTAS
    },
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
    async listar(filtro = {}) {
      await delay()
      return [...planes.values()]
        .filter((p) => !filtro.estado || p.estado === filtro.estado)
        .filter((p) => !filtro.plantaId || p.plantaId === filtro.plantaId)
        .sort((a, b) => b.semana - a.semana || a.plantaId - b.plantaId)
    },
    async getById(id) {
      await delay()
      return planOrThrow(id)
    },
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
      const plan = planOrThrow(planId)
      if (plan.estado !== "BORRADOR") {
        throw new ApiError("Solo se puede enviar un plan en borrador.", 409)
      }
      const enviado: Plan = { ...plan, estado: "PENDIENTE", fechaEnvio: new Date().toISOString() }
      planes.set(key(plan), enviado)
      return enviado
    },
    async aprobar(planId) {
      await delay()
      return decidir(planId, { estado: "APROBADO", comentarioAprobacion: null })
    },
    async rechazar(planId, comentario) {
      await delay()
      if (!comentario.trim()) throw new ApiError("El comentario es obligatorio para rechazar.", 400)
      return decidir(planId, { estado: "RECHAZADO", comentarioAprobacion: comentario.trim() })
    },
  },
  curso: {
    async getSemana(q) {
      await delay()
      const plan = planes.get(key(q))
      return cursoMock(q, new Date(), (fecha) => jornadas.cerradaDe(plan, fecha))
    },
  },
  jornadas: jornadas.repo,
}
