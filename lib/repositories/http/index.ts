import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import type {
  CursoSemana,
  Fruta,
  Plan,
  PlanCalculado,
  Planta,
  ProyeccionCosechaDia,
  ProyeccionComercialCliente,
} from "@/lib/domain"
import type { Repositories } from "../types"

/*
 * Implementación contra el API NestJS. Endpoints acordados en
 * contexto-plan-packing.md §6. `POST /planes/simular` es nuevo y debe
 * acordarse con el back (mismo body que `POST /planes`, no persiste).
 * `GET /jornadas/curso` también es nuevo: proyectado vs ejecutado de la
 * semana por planta (forma `CursoSemana`).
 */

export const httpRepositories: Repositories = {
  plantas: {
    listar: () => apiRequest<Planta[]>("/plantas"),
    getById: (id) => apiRequest<Planta>(`/plantas/${id}`),
  },
  frutas: {
    getById: (id) => apiRequest<Fruta>(`/frutas/${id}`),
  },
  proyecciones: {
    getCosecha: (q) =>
      apiRequest<ProyeccionCosechaDia[]>("/proyecciones", {
        query: { ...q, tipo: "COSECHA" },
      }),
    getComercial: (q) =>
      apiRequest<ProyeccionComercialCliente[]>("/proyecciones", {
        query: { ...q, tipo: "COMERCIAL" },
      }),
    importar: ({ archivo, ...campos }) => {
      const form = new FormData()
      for (const [key, value] of Object.entries(campos)) form.set(key, String(value))
      form.set("file", archivo)
      return apiRequest("/proyecciones/import", { method: "POST", formData: form })
    },
  },
  planes: {
    listar: (filtro) => apiRequest<Plan[]>("/planes", { query: filtro }),
    getById: (id) => apiRequest<Plan>(`/planes/${id}`),
    getVigente: async (q) => {
      const planes = await apiRequest<Plan[]>("/planes", { query: q })
      return planes[0] ?? null
    },
    simular: (input) =>
      apiRequest<PlanCalculado>("/planes/simular", { method: "POST", body: input }),
    aplicar: (input) => apiRequest<Plan>("/planes", { method: "POST", body: input }),
    enviar: (planId) => apiRequest<Plan>(`/planes/${planId}/enviar`, { method: "POST" }),
    aprobar: (planId) => apiRequest<Plan>(`/planes/${planId}/aprobar`, { method: "POST" }),
    rechazar: (planId, comentario) =>
      apiRequest<Plan>(`/planes/${planId}/rechazar`, {
        method: "POST",
        body: { comentarioAprobacion: comentario },
      }),
  },
  curso: {
    getSemana: async (q) => {
      const curso = await apiRequest<CursoSemana | null>("/jornadas/curso", { query: q })
      return curso?.dias.length ? curso : null
    },
  },
}
