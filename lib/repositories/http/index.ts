import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import type { Fruta, ProyeccionCosechaDia, ProyeccionComercialCliente } from "@/lib/domain"
import type { Repositories } from "../types"
import {
  fetchAreaMap,
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
import { httpCurso } from "./curso"
import { httpJornadas } from "./jornadas"

/*
 * Implementación contra el API NestJS real. Rutas y campos en inglés
 * (/plants, /plans, /projections, plantId, fruitId, year, week...); los
 * nombres en español son los del dominio del front. El mapeo entre ambos
 * contratos vive en ./mappers.
 *
 * El curso de la semana (subgerente) se mapea contra `GET /dashboard` en
 * ./curso y las jornadas del jefe de turno contra `workdays` en ./jornadas.
 */

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
    guardar: async ({ tipo, registros, plantaId, frutaId, anio, semana }) => {
      const res = await apiRequest<RawImportResult>("/projections", {
        method: "POST",
        body: { plantId: plantaId, fruitId: frutaId, year: anio, week: semana, type: tipo,
          rows: registros.map(r => ({ date: r.fecha, customerName: r.cliente, country: r.pais, quantity: r.jabas })) },
      })
      return { registros: res.imported }
    },
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
    descartar: async id => apiRequest<void>(`/plans/${id}`, { method: "DELETE" }),
    listar: async (filtro) => {
      const items: RawPlan[] = []
      for (let page = 1; ; page++) {
        const res = await apiRequest<RawPlanList>("/plans", {
          query: { plantId: filtro?.plantaId, status: filtro?.estado, limit: 100, page },
        })
        items.push(...res.items)
        if (res.items.length < 100) break
      }
      const areaMap = await fetchAreaMap()
      return Promise.all(items.map((p) => toPlan(p, areaMap)))
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
      const res = await apiRequest<RawPlan>(input.planId ? `/plans/${input.planId}` : "/plans", {
        method: input.planId ? "PATCH" : "POST",
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
  curso: httpCurso,
  jornadas: httpJornadas,
}
