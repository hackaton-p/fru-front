import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import type { Fruta, ProyeccionCosechaDia, ProyeccionComercialCliente } from "@/lib/domain"
import type { Repositories } from "../types"
import {
  fetchCustomerMap,
  toCreatePlanBody,
  toPlan,
  toPlanCalculado,
  toPlanta,
  toRawParametros,
  type RawFruit,
  type RawImportResult,
  type RawPlan,
  type RawPlanList,
  type RawPlant,
  type RawProjection,
  type RawSimulation,
} from "./mappers"
import { ApiError } from "@/lib/api/errors"

/*
 * Implementación contra el API NestJS real. Rutas y campos en inglés
 * (/plants, /plans, /projections, plantId, fruitId, year, week...); los
 * nombres en español son los del dominio del front. El mapeo entre ambos
 * contratos vive en ./mappers.
 *
 * `curso` y `jornadas` quedan sin implementar: las pantallas de subgerente
 * (curso de la semana) y jefe de turno asumen rutas `/jornadas/*` que no
 * existen en el back. Lo real es `GET /dashboard` (proyectado vs ejecutado
 * de la semana) y el módulo `workdays` (`/workdays`, `/workdays/:id`,
 * `/workdays/:id/records`, `/workdays/:id/close`, `/plan-days/:id/hours`,
 * `/alerts`) — falta mapear esas formas a `CursoSemana`/`Jornada`.
 */

const SIN_MAPEAR = (ruta: string) =>
  new ApiError(`${ruta} no está mapeado contra el back real todavía`, 501)

export const httpRepositories: Repositories = {
  plantas: {
    listar: async () => {
      const plantas = await apiRequest<RawPlant[]>("/plants")
      return plantas.map(toPlanta)
    },
    getById: async (id) => toPlanta(await apiRequest<RawPlant>(`/plants/${id}`)),
    actualizar: async (id, parametros) =>
      toPlanta(
        await apiRequest<RawPlant>(`/plants/${id}`, {
          method: "PATCH",
          body: toRawParametros(parametros),
        }),
      ),
  },
  frutas: {
    // El back no tiene GET /fruits/:id, solo la lista completa del catálogo.
    getById: async (id) => {
      const frutas = await apiRequest<RawFruit[]>("/fruits")
      const fruta = frutas.find((f) => f.id === id)
      if (!fruta) throw new ApiError("Fruta no encontrada", 404)
      return { id: fruta.id, nombre: fruta.name } satisfies Fruta
    },
  },
  proyecciones: {
    getCosecha: async (q) => {
      const raw = await apiRequest<RawProjection[]>("/projections", {
        query: { plantId: q.plantaId, fruitId: q.frutaId, year: q.anio, week: q.semana, type: "COSECHA" },
      })
      return raw.map(
        (p): ProyeccionCosechaDia => ({ fecha: p.date ?? "", jabas: Number(p.crates) }),
      )
    },
    getComercial: async (q) => {
      const [raw, clientes] = await Promise.all([
        apiRequest<RawProjection[]>("/projections", {
          query: {
            plantId: q.plantaId,
            fruitId: q.frutaId,
            year: q.anio,
            week: q.semana,
            type: "COMERCIAL",
          },
        }),
        fetchCustomerMap(),
      ])
      return raw.map((p): ProyeccionComercialCliente => {
        const clienteId = p.customerId ?? 0
        return {
          clienteId,
          cliente: clientes[clienteId] ?? `Cliente ${clienteId}`,
          jabas: Number(p.crates),
        }
      })
    },
    importar: async ({ archivo, tipo, plantaId, frutaId, anio, semana }) => {
      const form = new FormData()
      form.set("plantId", String(plantaId))
      form.set("fruitId", String(frutaId))
      form.set("year", String(anio))
      form.set("week", String(semana))
      form.set("type", tipo)
      form.set("file", archivo)
      const res = await apiRequest<RawImportResult>("/projections/import", {
        method: "POST",
        formData: form,
      })
      return { registros: res.imported }
    },
  },
  planes: {
    listar: async (filtro) => {
      const res = await apiRequest<RawPlanList>("/plans", {
        query: { plantId: filtro?.plantaId, status: filtro?.estado, limit: 100 },
      })
      return Promise.all(res.items.map(toPlan))
    },
    getById: async (id) => toPlan(await apiRequest<RawPlan>(`/plans/${id}`)),
    getVigente: async (q) => {
      const res = await apiRequest<RawPlanList>("/plans", {
        query: { plantId: q.plantaId, fruitId: q.frutaId, year: q.anio, week: q.semana },
      })
      const plan = res.items[0]
      return plan ? toPlan(plan) : null
    },
    simular: async (input) => {
      const res = await apiRequest<RawSimulation>("/plans/simulate", {
        method: "POST",
        body: toCreatePlanBody(input),
      })
      return toPlanCalculado(res, input.escenarioCosecha)
    },
    aplicar: async (input) => {
      const res = await apiRequest<RawPlan>("/plans", {
        method: "POST",
        body: toCreatePlanBody(input),
      })
      return toPlan(res)
    },
    enviar: async (planId) => {
      const res = await apiRequest<RawPlan>(`/plans/${planId}/submit`, { method: "POST" })
      return toPlan(res)
    },
    aprobar: async (planId) => {
      const res = await apiRequest<RawPlan>(`/plans/${planId}/approve`, { method: "POST" })
      return toPlan(res)
    },
    rechazar: async (planId, comentario) => {
      const res = await apiRequest<RawPlan>(`/plans/${planId}/reject`, {
        method: "POST",
        body: { comment: comentario },
      })
      return toPlan(res)
    },
  },
  curso: {
    getSemana: async () => {
      throw SIN_MAPEAR("GET /jornadas/curso (real: GET /dashboard)")
    },
  },
  jornadas: {
    getActual: async () => {
      throw SIN_MAPEAR("GET /jornadas/actual (real: componer desde /plans + /workdays)")
    },
    iniciar: async () => {
      throw SIN_MAPEAR("POST /jornadas (real: POST /workdays)")
    },
    registrar: async () => {
      throw SIN_MAPEAR("POST /jornadas/:id/registros (real: POST /workdays/:id/records)")
    },
    ajustarHoras: async () => {
      throw SIN_MAPEAR("PATCH /jornadas/:id/ajuste-horas (real: PATCH /plan-days/:id/hours)")
    },
    cerrar: async () => {
      throw SIN_MAPEAR("POST /jornadas/:id/cerrar (real: POST /workdays/:id/close)")
    },
  },
}
