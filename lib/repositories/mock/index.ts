import "server-only"
import { ApiError } from "@/lib/api/errors"
import { addDays, mondayOfIsoWeek, nextPlanningMonday, planningDates, toIsoDate } from "@/lib/dates"
import type { CalcularPlanInput, Fruta, Plan, PlanCalculado, Planta, SemanaQuery, GuardarProyeccionInput } from "@/lib/domain"
import { parametrosSchema } from "@/lib/parametros"
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

const key = (q: { plantaId: number; frutaId?: number | null; semana: number }) => `${q.plantaId}-${q.frutaId ?? "all"}-${q.semana}`

// Sobrevive al hot reload en desarrollo. Arranca con los planes de ejemplo.
const store = globalThis as unknown as {
  __mockPlantas?: Map<number, Planta>
  __mockPlanes?: Map<string, Plan>
  __mockPlanId?: number
  __mockJornadas?: JornadasStore
  __mockProjections?: Map<string, GuardarProyeccionInput>
  __mockFruitCatalog?: Map<number, Fruta>
  __mockFruitPlantIds?: Map<number, number[]>
  __mockPlantId?: number
  __mockFruitId?: number
}
// Copia editable desde "Configuración de planta"; los planes semilla usan los valores originales.
const plantas = (store.__mockPlantas ??= new Map(PLANTAS.map((p) => [p.id, { ...p }])))
const frutas = (store.__mockFruitCatalog ??= new Map(FRUTAS.map((fruit) => [fruit.id, { ...fruit, activo: true }])))
const frutaPlantas = (store.__mockFruitPlantIds ??= new Map(FRUTAS.map((fruit) => [fruit.id, [1, 2]])))
store.__mockPlantId ??= Math.max(...plantas.keys(), 0)
store.__mockFruitId ??= Math.max(...frutas.keys(), 0)
const planes = (store.__mockPlanes ??= new Map(planesSemilla().map((p) => [key(p), p])))
const latestPlan = (q: SemanaQuery) => [...planes.values()].filter(p => p.plantaId === q.plantaId && (p.frutaId === null || p.frutaId === q.frutaId) && p.anio === q.anio && p.semana === q.semana).sort((a, b) => b.id - a.id)[0]
const savePlan = (plan: Plan) => {
  const entry = [...planes.entries()].find(([, p]) => p.id === plan.id)
  planes.set(entry?.[0] ?? `${key(plan)}-${plan.id}`, plan)
}
const projections: Map<string, GuardarProyeccionInput> = (store.__mockProjections ??= new Map<string, GuardarProyeccionInput>())
const projectionKey = (q: SemanaQuery, type: string) => `${q.plantaId}-${q.frutaId}-${q.anio}-${q.semana}-${type}`
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
  if (cambios.estado === "APROBADO" && [...planes.values()].some(p => p.id !== plan.id && p.plantaId === plan.plantaId && p.anio === plan.anio && p.semana === plan.semana && ["APROBADO", "EN_EJECUCION", "CERRADO"].includes(p.estado))) throw new ApiError("Ya existe un plan aprobado para esta semana.", 409)
  savePlan(decidido)
  return decidido
}

function plantaOrThrow(id: number) {
  const planta = plantas.get(id)
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
  if (!planta.configuradaAt) {
    throw new ApiError("Confirma la configuración de la planta antes de planificar.", 409)
  }
  const cosecha = FRUTAS.flatMap(({ id, nombre }) => {
    const query = { ...input, frutaId: id }
    const saved = projections.get(projectionKey(query, "COSECHA"))
    return (saved?.registros.map(r => ({ frutaId: id, fruta: nombre, fecha: r.fecha!, jabas: r.jabas })) ?? cosechaMock(input.plantaId, input.semana, id))
  })
  const comercial = FRUTAS.flatMap(({ id }) => {
    const query = { ...input, frutaId: id }
    const saved = projections.get(projectionKey(query, "COMERCIAL"))
    return saved?.registros.map((r, index) => ({ frutaId: id, clienteId: index + 1, cliente: r.cliente!, jabas: r.jabas })) ?? comercialMock(input.plantaId, id)
  })
  return calcularPlan({
    cosecha: input.fechas || input.inicio ? cosecha.filter(d => planningDates(input).includes(d.fecha)) : cosecha,
    totalComercial: comercial.reduce((sum, row) => sum + row.jabas, 0),
    comercialPorFruta: FRUTAS.map(({ id }) => ({ frutaId: id, jabas: comercial.filter((row) => row.frutaId === id).reduce((sum, row) => sum + row.jabas, 0) })),
    parametros: input.parametros,
    parametrosModificados: EDITABLES.some((k) => input.parametros[k] !== planta[k]),
    escenarioCosecha: input.escenarioCosecha,
  })
}

export const mockRepositories: Repositories = {
  plantas: {
    async listar(options) {
      await delay()
      return [...plantas.values()].filter((plant) => options?.includeInactive || plant.activo !== false)
    },
    async getById(id) {
      await delay()
      return plantaOrThrow(id)
    },
    async actualizar(id, parametros) {
      await delay()
      const planta = plantaOrThrow(id)
      const parsed = parametrosSchema.safeParse(parametros)
      if (!parsed.success) throw new ApiError("Hay valores fuera de rango.", 400)
      const ahora = new Date().toISOString()
      const actualizada: Planta = {
        ...planta,
        ...parsed.data,
        configuradaAt: ahora,
        updatedAt: ahora,
      }
      plantas.set(id, actualizada)
      return actualizada
    },
    async crear(input) {
      await delay()
      if (!input.nombre.trim()) throw new ApiError("Escribe el nombre de la planta.", 400)
      if ([...plantas.values()].some((plant) => plant.nombre.toLowerCase() === input.nombre.trim().toLowerCase())) throw new ApiError("Ya existe una planta con ese nombre.", 409)
      store.__mockPlantId = (store.__mockPlantId ?? 0) + 1
      const id = store.__mockPlantId
      const plant: Planta = { id, nombre: input.nombre.trim(), rendimientoPersonaHora: 5.9, personalMaximo: 300, horasJornada: 10, horasExtraMax: 2, horaInicio: "17:00", factorEficiencia: 0.8, toleranciaVolumen: 5, configuradaAt: null, updatedAt: new Date().toISOString(), activo: true }
      plantas.set(id, plant)
      return plant
    },
    async actualizarCatalogo(id, input) {
      await delay()
      const plant = plantaOrThrow(id)
      if (!input.nombre.trim()) throw new ApiError("Escribe el nombre de la planta.", 400)
      if ([...plantas.values()].some((item) => item.id !== id && item.nombre.toLowerCase() === input.nombre.trim().toLowerCase())) throw new ApiError("Ya existe una planta con ese nombre.", 409)
      const updated: Planta = { ...plant, nombre: input.nombre.trim(), activo: input.activo ?? plant.activo, updatedAt: new Date().toISOString() }
      plantas.set(id, updated)
      return updated
    },
    async desactivar(id) {
      await delay()
      const plant = plantaOrThrow(id)
      plantas.set(id, { ...plant, activo: false, updatedAt: new Date().toISOString() })
    },
  },
  frutas: {
    async listar(plantId, includeInactive = false) {
      await delay()
      return [...frutas.values()]
        .filter((fruit) => includeInactive || fruit.activo !== false)
        .filter((fruit) => plantId === undefined || (frutaPlantas.get(fruit.id) ?? []).includes(plantId))
        .map((fruit) => ({ ...fruit, plantaIds: frutaPlantas.get(fruit.id) ?? [] }))
    },
    async getById(id) {
      const fruta = frutas.get(id)
      if (!fruta) throw new ApiError("Fruta no encontrada", 404)
      return fruta
    },
    async crear(input) {
      await delay()
      if (!input.nombre.trim() || input.plantaIds.length === 0) throw new ApiError("Indica un nombre y al menos una planta.", 400)
      if ([...frutas.values()].some((fruit) => fruit.nombre.toLowerCase() === input.nombre.trim().toLowerCase())) throw new ApiError("Ya existe una fruta con ese nombre.", 409)
      store.__mockFruitId = (store.__mockFruitId ?? 0) + 1
      const id = store.__mockFruitId
      const fruit: Fruta = { ...input, id, nombre: input.nombre.trim(), activo: true }
      frutas.set(id, fruit)
      frutaPlantas.set(id, input.plantaIds)
      return fruit
    },
    async actualizar(id, input) {
      await delay()
      const old = frutas.get(id)
      if (!old) throw new ApiError("Fruta no encontrada", 404)
      if (!input.nombre.trim() || input.plantaIds.length === 0) throw new ApiError("Indica un nombre y al menos una planta.", 400)
      if ([...frutas.values()].some((fruit) => fruit.id !== id && fruit.nombre.toLowerCase() === input.nombre.trim().toLowerCase())) throw new ApiError("Ya existe una fruta con ese nombre.", 409)
      const fruit: Fruta = { ...old, ...input, nombre: input.nombre.trim() }
      frutas.set(id, fruit)
      frutaPlantas.set(id, input.plantaIds)
      return fruit
    },
    async desactivar(id) {
      await delay()
      const fruit = frutas.get(id)
      if (!fruit) throw new ApiError("Fruta no encontrada", 404)
      frutas.set(id, { ...fruit, activo: false })
    },
  },
  proyecciones: {
    async guardar(input) {
      const projectionId = projectionKey(input, input.tipo)
      if (projections.has(projectionId)) throw new ApiError("La proyección ya fue registrada.", 409)
      projections.set(projectionId, input)
      return { registros: input.registros.length }
    },
    async getCosecha(q) {
      await delay()
      return FRUTAS.flatMap(({ id, nombre }) => {
        const saved = projections.get(projectionKey({ ...q, frutaId: id }, "COSECHA"))
        return saved ? saved.registros.map(r => ({ frutaId: id, fruta: nombre, fecha: r.fecha!, jabas: r.jabas })) : cosechaMock(q.plantaId, q.semana, id)
      })
    },
    async getComercial(q) {
      await delay()
      return FRUTAS.flatMap(({ id, nombre }) => {
        const saved = projections.get(projectionKey({ ...q, frutaId: id }, "COMERCIAL"))
        return saved ? saved.registros.map((r, i) => ({ frutaId: id, fruta: nombre, clienteId: i + 1, cliente: r.cliente!, jabas: r.jabas })) : comercialMock(q.plantaId, id)
      })
    },
    async importar({ archivo }) {
      await delay()
      if (!archivo.size) throw new ApiError("El archivo está vacío.", 400)
      // El mock no procesa el Excel: los datos de ejemplo no cambian.
      return { registros: 0 }
    },
  },
  planes: {
    async descartar(id) {
      const plan = planOrThrow(id)
      if (!((plan.estado === "BORRADOR" && !plan.fechaEnvio) || plan.estado === "RECHAZADO")) throw new ApiError("Solo puedes descartar planes sin enviar o rechazados.", 409)
      for (const [mapKey, p] of planes) if (p.id === id) planes.delete(mapKey)
    },
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
      return latestPlan(q) ?? null
    },
    async simular(input) {
      await delay()
      return calcular(input)
    },
    async aplicar(input) {
      await delay()
      const actual = input.planId
        ? planOrThrow(input.planId)
        : [...planes.values()].find(p => p.plantaId === input.plantaId && p.frutaId === null && p.anio === input.anio && p.semana === input.semana && (p.estado === "BORRADOR" || p.estado === "RECHAZADO"))
      if (!input.planId && [...planes.values()].some(p => p.plantaId === input.plantaId && p.frutaId === null && p.anio === input.anio && p.semana === input.semana && !["BORRADOR", "RECHAZADO"].includes(p.estado))) throw new ApiError("El plan semanal ya fue enviado y no se puede reemplazar.", 409)
      if (!actual && toIsoDate(mondayOfIsoWeek(input.anio, input.semana)) < nextPlanningMonday(new Date())) throw new ApiError("New plans must start next week or later", 400)
      if (!actual && input.fechas) {
        const monday = toIsoDate(mondayOfIsoWeek(input.anio, input.semana))
        const allowed = Array.from({ length: 6 }, (_, i) => toIsoDate(addDays(mondayOfIsoWeek(input.anio, input.semana), i)))
        if (input.fechas.length < 2 || input.fechas.length > 6 || new Set(input.fechas).size !== input.fechas.length || !input.fechas.includes(monday) || input.fechas.some(date => !allowed.includes(date))) throw new ApiError("Invalid planning period", 400)
      }
      if (actual && actual.estado !== "BORRADOR" && actual.estado !== "RECHAZADO") {
        throw new ApiError("El plan de esta semana ya fue enviado y no se puede reemplazar.", 409)
      }
      store.__mockPlanId = (store.__mockPlanId ?? 0) + 1
      if (actual && (input.inicio && actual.dias[0]?.fecha !== input.inicio || input.cantidadDias && actual.dias.length !== input.cantidadDias)) throw new ApiError("El período del plan no puede modificarse.", 409)
      if (actual && input.fechas && [...input.fechas].sort().join(",") !== actual.dias.map(day => day.fecha).sort().join(",")) throw new ApiError("El período del plan no puede modificarse.", 409)
      const calculationInput = actual ? { ...input, fechas: actual.dias.map(day => day.fecha) } : input
      const plan: Plan = {
        ...calcular(calculationInput),
        id: actual?.id ?? store.__mockPlanId,
        plantaId: input.plantaId,
        frutaId: null,
        anio: input.anio,
        semana: input.semana,
        estado: "BORRADOR",
        updatedAt: new Date().toISOString(),
        fechaEnvio: null,
        comentarioAprobacion: null,
      }
      savePlan(plan)
      return plan
    },
    async enviar(planId) {
      await delay()
      const plan = planOrThrow(planId)
      if (plan.estado !== "BORRADOR") {
        throw new ApiError("Solo se puede enviar un plan en borrador.", 409)
      }
      const enviado: Plan = { ...plan, estado: "PENDIENTE", fechaEnvio: new Date().toISOString() }
      savePlan(enviado)
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
      const plan = latestPlan(q)
      return cursoMock(q, new Date(), (fecha) => jornadas.cerradaDe(plan, fecha))
    },
  },
  jornadas: jornadas.repo,
}
