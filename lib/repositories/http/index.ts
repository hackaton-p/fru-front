import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import type { Fruta, Jornada, JornadaDelDia, ProyeccionCosechaDia, ProyeccionComercialCliente } from "@/lib/domain"
import { isoWeek, parseIsoDate } from "@/lib/dates"
import type { Repositories } from "../types"
import {
  fetchCustomerMap,
  fetchAreaMap,
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
 * `curso` y las mutaciones de `jornadas` siguen pendientes de mapeo: las
 * pantallas asumen rutas `/jornadas/*` que no existen en el back. Lo real es
 * `GET /dashboard` (proyectado vs ejecutado
 * de la semana) y el módulo `workdays` (`/workdays`, `/workdays/:id`,
 * `/workdays/:id/records`, `/workdays/:id/close`, `/plan-days/:id/hours`,
 * `/alerts`) — falta mapear esas formas a `CursoSemana`/`Jornada`.
 */

const SIN_MAPEAR = (ruta: string) =>
  new ApiError(`${ruta} no está mapeado contra el back real todavía`, 501)

interface RawWorkday {
  id: number
  planDayId: number
  startedAt: string
  closedAt: string | null
  initialEstimatedHours: string | null
  expectedDailyCrates: string
  presentWorkers: number
  receivedCrates: string
  workedHours: string | null
  processedCrates: string
  discardedCrates: string | null
  looseKg: string | null
  fixedKg: string | null
  targetMet: boolean | null
  difference: string | null
}

interface RawWorkdayDetails extends RawWorkday {
  attendance: { areaId: number; plannedWorkers: number; arrivedWorkers: number | null; startingWorkers: number | null; presentWorkers: number | null }[]
  progress: { id: number; type: "AVANCE" | "PERSONAL" | "VOLUMEN"; areaId: number | null; staffChange: number | null; expectedDailyCrates: string | null; estimatedHours: string | null; recordedAt: string; cumulativeReceivedCrates: string | null; cumulativeProcessedCrates: string | null; presentWorkers: number }[]
  alerts: { progressRecordId: number | null; type: string; message: string }[]
  metrics: { productivity: number; remainingCrates: number; estimatedHours: number | null }
}

function fechaActualLima(): Date {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
  }).formatToParts(new Date())
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]))
  return parseIsoDate(`${values.year}-${values.month}-${values.day}`)
}

function horaLocal(value: string): string {
  const date = new Date(value)
  const time = new Intl.DateTimeFormat("en-GB", {
    timeZone: "America/Lima", hour: "2-digit", minute: "2-digit", hourCycle: "h23",
  }).format(date)
  return `${value.slice(0, 10)}T${time}`
}

async function mapWorkday(raw: RawWorkdayDetails, plan: Awaited<ReturnType<typeof toPlan>>, date: string): Promise<Jornada> {
  const areaMap = await fetchAreaMap()
  const areaCode = (id: number | null) => id === null ? undefined : areaMap[id]
  const alertas = (progressId: number) => raw.alerts
    .filter((alert) => alert.progressRecordId === progressId && alert.type !== "PLANIFICACION")
    .map((alert) => ({ tipo: alert.type as "VOLUMEN_ENTRANTE" | "PERSONAL_INSUFICIENTE", mensaje: alert.message }))
  const registros = raw.progress.map((record) => {
    const base = {
      id: record.id,
      hora: horaLocal(record.recordedAt),
      trabajadoresPresentes: record.presentWorkers,
      horasEstimadas: Number(record.estimatedHours ?? raw.initialEstimatedHours ?? 0),
      alertas: alertas(record.id),
    }
    if (record.type === "AVANCE") return { ...base, tipo: "AVANCE" as const, jabasRecibidasAcum: Number(record.cumulativeReceivedCrates ?? 0), jabasProcesadasAcum: Number(record.cumulativeProcessedCrates ?? 0) }
    if (record.type === "PERSONAL") {
      const area = areaCode(record.areaId)
      if (!area) throw new ApiError(`Área desconocida en el back (id ${record.areaId})`, 500)
      return { ...base, tipo: "PERSONAL" as const, area, cambioPersonal: Number(record.staffChange ?? 0) }
    }
    return { ...base, tipo: "VOLUMEN" as const, jabasEsperadasDia: Number(record.expectedDailyCrates ?? 0) }
  })
  const lastProgress = raw.progress.at(-1)
  const currentTime = raw.closedAt ?? new Date().toISOString()
  const elapsed = raw.closedAt && raw.workedHours != null
    ? Number(raw.workedHours)
    : Math.max(0, (new Date(currentTime).getTime() - new Date(raw.startedAt).getTime()) / 3_600_000)
  const estimatedHours = raw.closedAt
    ? Number(raw.workedHours ?? raw.initialEstimatedHours ?? 0)
    : Number(raw.metrics.estimatedHours ?? raw.initialEstimatedHours ?? 0)
  const journey: Jornada = {
    id: raw.id,
    planId: plan.id,
    fecha: date,
    estado: raw.closedAt ? "CERRADA" : "ABIERTA",
    horaInicio: horaLocal(raw.startedAt),
    horasEstimadasInicio: Number(raw.initialEstimatedHours ?? 0),
    areas: raw.attendance.map((entry) => {
      const area = areaCode(entry.areaId)
      if (!area) throw new ApiError(`Área desconocida en el back (id ${entry.areaId})`, 500)
      return { area, trabajadoresPlan: entry.plannedWorkers, trabajadoresLlegaron: entry.arrivedWorkers ?? 0, trabajadoresInicio: entry.startingWorkers ?? 0, trabajadoresPresentes: entry.presentWorkers ?? entry.startingWorkers ?? 0 }
    }),
    registros,
    estimacion: {
      horasTranscurridas: elapsed,
      trabajadoresPresentes: raw.presentWorkers,
      jabasProcesadas: Number(lastProgress?.cumulativeProcessedCrates ?? raw.processedCrates),
      volumenDia: Number(raw.expectedDailyCrates),
      productividad: raw.metrics.productivity,
      ritmoReal: raw.progress.some((record) => record.type === "AVANCE"),
      pendiente: raw.metrics.remainingCrates,
      horasEstimadas: estimatedHours,
      motivoSugerido: plan.dias.find((day) => day.fecha === date)?.motivoAjuste ?? "PERSONAL_PRESENTE",
    },
    cierre: raw.closedAt ? {
      horasTrabajadas: Number(raw.workedHours ?? 0),
      jabasProcesadas: Number(raw.processedCrates),
      jabasDescarte: Number(raw.discardedCrates ?? 0),
      kgLoose: Number(raw.looseKg ?? 0),
      kgFijo: Number(raw.fixedKg ?? 0),
      metaCumplida: raw.targetMet ?? false,
      diferencia: Number(raw.difference ?? 0),
    } : null,
  }
  return journey
}

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
    listar: async (filtro) => {
      const items: RawPlan[] = []
      for (let page = 1; ; page++) {
        const res = await apiRequest<RawPlanList>("/plans", {
          query: { plantId: filtro?.plantaId, status: filtro?.estado, limit: 100, page },
        })
        items.push(...res.items)
        if (res.items.length < 100) break
      }
      return Promise.all(items.map(toPlan))
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
    getActual: async (plantaId) => {
      const { year, week } = isoWeek(fechaActualLima())
      const list = async (status: "APROBADO" | "EN_EJECUCION" | "CERRADO") => {
        const items: RawPlan[] = []
        for (let page = 1; ; page++) {
          const result = await apiRequest<RawPlanList>("/plans", {
            query: { plantId: plantaId, year, week, status, limit: 100, page },
          })
          items.push(...result.items)
          if (result.items.length < 100) break
        }
        return items
      }
      const [inProgress, approved, closed] = await Promise.all([
        list("EN_EJECUCION"),
        list("APROBADO"),
        list("CERRADO"),
      ])
      const active = [...inProgress, ...approved].sort((a, b) =>
        Number(b.status === "EN_EJECUCION") - Number(a.status === "EN_EJECUCION") || a.id - b.id,
      )

      for (const rawPlan of active) {
        const plan = await toPlan(rawPlan)
        const rawDay = [...rawPlan.days].sort((a, b) => a.date.localeCompare(b.date))
          .find((day) => !day.workday?.closedAt)
        if (!rawDay) continue
        const dia = plan.dias.find((day) => day.fecha === rawDay.date)
        if (!dia) continue
        const jornada = rawDay.workday
          ? await mapWorkday(await apiRequest<RawWorkdayDetails>(`/workdays/${rawDay.workday.id}`), plan, rawDay.date)
          : null
        return { plan, dia, jornada } satisfies JornadaDelDia
      }

      const lastClosed = closed
        .flatMap((plan) => plan.days.filter((day) => day.workday?.closedAt).map((day) => ({ plan, day })))
        .sort((a, b) => b.day.date.localeCompare(a.day.date))[0]
      if (!lastClosed?.day.workday) return null
      const plan = await toPlan(lastClosed.plan)
      const dia = plan.dias.find((day) => day.fecha === lastClosed.day.date)
      if (!dia) return null
      const jornada = await mapWorkday(
        await apiRequest<RawWorkdayDetails>(`/workdays/${lastClosed.day.workday.id}`),
        plan,
        lastClosed.day.date,
      )
      return { plan, dia, jornada } satisfies JornadaDelDia
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
