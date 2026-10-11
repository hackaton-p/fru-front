import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import type { Fruta, ProyeccionCosechaDia, ProyeccionComercialCliente } from "@/lib/domain"
import type { Repositories } from "../types"
import {
  fetchAreaMap,
  fetchCustomerMap,
  fetchFruitMap,
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
    listar: async (options) => {
      const plantas = await apiRequest<RawPlant[]>("/plants", { query: { includeInactive: options?.includeInactive } })
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
    crear: async (input) => toPlanta(await apiRequest<RawPlant>("/plants", {
      method: "POST",
      body: { name: input.nombre },
    })),
    actualizarCatalogo: async (id, input) => toPlanta(await apiRequest<RawPlant>(`/plants/${id}/catalog`, {
      method: "PATCH",
      body: { name: input.nombre, isActive: input.activo ?? true },
    })),
    desactivar: async (id) => { await apiRequest<void>(`/plants/${id}`, { method: "DELETE" }) },
  },
  frutas: {
    listar: async (plantId, includeInactive) => (await apiRequest<RawFruit[]>("/fruits", { query: { plantId, includeInactive } })).map((f) => ({ id: f.id, nombre: f.name, activo: f.isActive ?? true, plantaIds: f.plantIds ?? [] })),
    getById: async (id) => {
      const fruta = await apiRequest<RawFruit>(`/fruits/${id}`)
      return { id: fruta.id, nombre: fruta.name, activo: fruta.isActive ?? true, plantaIds: fruta.plantIds ?? [] } satisfies Fruta
    },
    crear: async (input) => {
      const fruit = await apiRequest<RawFruit>("/fruits", { method: "POST", body: { name: input.nombre, plantIds: input.plantaIds, isActive: input.activo ?? true } })
      return { id: fruit.id, nombre: fruit.name, activo: fruit.isActive ?? true, plantaIds: fruit.plantIds ?? input.plantaIds }
    },
    actualizar: async (id, input) => {
      const fruit = await apiRequest<RawFruit>(`/fruits/${id}`, { method: "PATCH", body: { name: input.nombre, plantIds: input.plantaIds, isActive: input.activo ?? true } })
      return { id: fruit.id, nombre: fruit.name, activo: fruit.isActive ?? true, plantaIds: fruit.plantIds ?? input.plantaIds }
    },
    desactivar: async (id) => { await apiRequest<void>(`/fruits/${id}`, { method: "DELETE" }) },
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
        query: { plantId: q.plantaId, year: q.anio, week: q.semana, type: "COSECHA" },
      })
      const fruits = await fetchFruitMap(q.plantaId)
      return raw.map((p): ProyeccionCosechaDia => ({ frutaId: p.fruitId, fruta: fruits[p.fruitId] ?? `Fruta ${p.fruitId}`, fecha: p.date ?? "", jabas: Number(p.crates) }))
    },
    getComercial: async (q) => {
      const [raw, clientes, frutas] = await Promise.all([
        apiRequest<RawProjection[]>("/projections", {
          query: {
            plantId: q.plantaId,
            year: q.anio,
            week: q.semana,
            type: "COMERCIAL",
          },
        }),
        fetchCustomerMap(),
        fetchFruitMap(q.plantaId),
      ])
      return raw.map((p): ProyeccionComercialCliente => {
        const clienteId = p.customerId ?? 0
        return {
          frutaId: p.fruitId,
          fruta: frutas[p.fruitId] ?? `Fruta ${p.fruitId}`,
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
        query: { plantId: q.plantaId, year: q.anio, week: q.semana },
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
