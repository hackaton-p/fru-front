import "server-only"
import { cache } from "react"
import { apiRequest } from "@/lib/api/http-client"
import { ApiError } from "@/lib/api/errors"
import {
  repartirPorArea,
  type AlertaJornada,
  type AreaCodigo,
  type EjecucionDia,
  type Jornada,
  type JornadaArea,
  type Plan,
  type PlanDia,
  type RegistroAvance,
  type TipoAlertaJornada,
} from "@/lib/domain"
import {
  alertasDe,
  estimar,
  horaDeJornada,
  type ContextoJornada,
  type Evento,
} from "../mock/jornada-calculator"
import type { JornadasRepository } from "../types"
import {
  fetchAreaMap,
  toPlan,
  type RawPlan,
  type RawPlanDayArea,
  type RawPlanList,
  type RawWorkday,
} from "./mappers"

/*
 * Jornadas contra el módulo `workdays` del back:
 * - El día que toca se compone desde `GET /plans` (cada día trae su `workday`).
 * - El detalle de la jornada sale de `GET /workdays/:id` (asistencia por área,
 *   registros y alertas). El estimado vigente se recalcula aquí con la misma
 *   fórmula del back (jornada-calculator) porque el back no lo guarda.
 * - Las fechas-hora del back son UTC; el dominio usa hora local de planta
 *   (America/Lima, UTC−5 todo el año).
 */

const OFFSET_LIMA_MS = -5 * 3_600_000

/** ISO UTC → "YYYY-MM-DDTHH:mm" en hora de planta. */
function aLocal(iso: string | Date): string {
  const ms = typeof iso === "string" ? Date.parse(iso) : iso.getTime()
  return new Date(ms + OFFSET_LIMA_MS).toISOString().slice(0, 16)
}

/** "YYYY-MM-DDTHH:mm" de planta → ISO con offset, para el back. */
function aUtc(local: string): string {
  return `${local}:00-05:00`
}

interface RawProgress {
  id: number
  type: "AVANCE" | "PERSONAL" | "VOLUMEN"
  recordedAt: string
  areaId: number | null
  staffChange: number | null
  expectedDailyCrates: string | null
  cumulativeReceivedCrates: string | null
  cumulativeProcessedCrates: string | null
  processedByFruit?: { fruitId: number; fruitName?: string; crates: string }[] | null
  presentWorkers: number
  estimatedHours: string | null
}

interface RawAlert {
  id: number
  progressRecordId: number | null
  type: string
  message: string
}

interface RawPlanDayRef {
  id: number
  planId: number
  date: string
}

interface RawWorkdayDetail extends RawWorkday {
  planDay: RawPlanDayRef
  attendance: (RawPlanDayArea & { id: number })[]
  progress: RawProgress[]
  alerts: RawAlert[]
}

const ESTADOS_JEFE_TURNO = ["EN_EJECUCION", "APROBADO", "CERRADO"] as const

async function planesPorEstado(plantId: number, status: string): Promise<RawPlan[]> {
  const items: RawPlan[] = []
  for (let page = 1; ; page++) {
    const res = await apiRequest<RawPlanList>("/plans", {
      query: { plantId, status, limit: 100, page },
    })
    items.push(...res.items)
    if (res.items.length < 100) return items
  }
}

/** Planes que ve el jefe de turno, ya mapeados; uno solo por request aunque se pida dos veces. */
const planesDePlanta = cache(async (plantId: number) => {
  const [areaMap, porEstado] = await Promise.all([
    fetchAreaMap(),
    Promise.all(ESTADOS_JEFE_TURNO.map((s) => planesPorEstado(plantId, s))),
  ])
  const raws = porEstado.flat().sort((a, b) => b.year - a.year || b.week - a.week)
  return Promise.all(raws.map(async (raw) => ({ raw, plan: await toPlan(raw, areaMap), areaMap })))
})

function ejecucionDe(workday: RawWorkday | null | undefined): EjecucionDia {
  if (!workday) return "PENDIENTE"
  return workday.closedAt ? "CERRADA" : "ABIERTA"
}

function contexto(plan: Plan, dia: PlanDia): ContextoJornada {
  return {
    meta: dia.jabasMeta,
    horasPlan: dia.horasActualizadas ?? dia.horas,
    trabajadoresPlan: dia.trabajadores,
    parametros: plan.parametrosUsados,
  }
}

function diaDe(plan: Plan, fecha: string): PlanDia {
  const dia = plan.dias.find((d) => d.fecha === fecha)
  if (!dia) throw new ApiError("El día no pertenece al plan.", 400)
  return dia
}

function areaDe(areaMap: Record<number, AreaCodigo>, areaId: number): AreaCodigo {
  const area = areaMap[areaId]
  if (!area) throw new ApiError(`Área desconocida en el back (id ${areaId})`, 500)
  return area
}

function areaIdDe(areaMap: Record<number, AreaCodigo>, area: AreaCodigo): number {
  const id = Object.entries(areaMap).find(([, code]) => code === area)?.[0]
  if (!id) throw new ApiError("Área no válida.", 400)
  return Number(id)
}

function toEvento(r: RawProgress, areaMap: Record<number, AreaCodigo>): Evento {
  const hora = aLocal(r.recordedAt)
  if (r.type === "AVANCE") {
    return {
      tipo: "AVANCE",
      hora,
      jabasRecibidasAcum: Number(r.cumulativeReceivedCrates),
      jabasProcesadasAcum: Number(r.cumulativeProcessedCrates),
      jabasPorFruta: (r.processedByFruit ?? []).map((item) => ({ frutaId: item.fruitId, fruta: item.fruitName ?? `Fruta ${item.fruitId}`, jabas: Number(item.crates) })),
    }
  }
  if (r.type === "PERSONAL") {
    return { tipo: "PERSONAL", hora, area: areaDe(areaMap, r.areaId!), cambioPersonal: r.staffChange! }
  }
  return { tipo: "VOLUMEN", hora, jabasEsperadasDia: Number(r.expectedDailyCrates) }
}

/** Arma la jornada del dominio desde el detalle del back y el plan al que pertenece. */
function toJornada(
  w: RawWorkdayDetail,
  plan: Plan,
  areaMap: Record<number, AreaCodigo>,
): Jornada {
  const dia = diaDe(plan, w.planDay.date)
  const ctx = contexto(plan, dia)
  const horaInicio = aLocal(w.startedAt)

  const areas: JornadaArea[] = w.attendance.map((a) => ({
    area: areaDe(areaMap, a.areaId),
    trabajadoresPlan: a.plannedWorkers,
    trabajadoresLlegaron: a.arrivedWorkers ?? 0,
    trabajadoresInicio: a.startingWorkers ?? 0,
    trabajadoresPresentes: a.presentWorkers ?? 0,
  }))
  const inicio = areas.reduce((s, a) => s + a.trabajadoresInicio, 0)

  const eventos: Evento[] = []
  const registros = w.progress.map((r): RegistroAvance => {
    const evento = toEvento(r, areaMap)
    eventos.push(evento)
    const est = estimar(horaInicio, inicio, eventos, ctx)
    // El tipo de alerta lo decide el back; el texto se arma en español con los mismos números.
    const locales = alertasDe(evento, horaInicio, est, ctx)
    const alertas = w.alerts
      .filter((a) => a.progressRecordId === r.id)
      .map(
        (a): AlertaJornada => ({
          tipo: a.type as TipoAlertaJornada,
          mensaje: locales.find((l) => l.tipo === a.type)?.mensaje ?? a.message,
        }),
      )
    return {
      ...evento,
      id: r.id,
      trabajadoresPresentes: r.presentWorkers,
      horasEstimadas: r.estimatedHours == null ? est.horasEstimadas : Number(r.estimatedHours),
      alertas,
    } as RegistroAvance
  })

  return {
    id: w.id,
    planId: plan.id,
    fecha: dia.fecha,
    estado: w.closedAt ? "CERRADA" : "ABIERTA",
    horaInicio,
    horasEstimadasInicio: Number(w.initialEstimatedHours ?? 0),
    areas,
    registros,
    jabasPorFruta: (w.processedByFruit ?? []).map((item) => ({ frutaId: item.fruitId, fruta: item.fruitName ?? `Fruta ${item.fruitId}`, jabas: Number(item.crates) })),
    estimacion: estimar(horaInicio, inicio, eventos, ctx),
    cierre: w.closedAt
      ? {
          horasTrabajadas: Number(w.workedHours ?? 0),
          jabasProcesadas: Number(w.processedCrates),
          jabasDescarte: Number(w.discardedCrates ?? 0),
          kgLoose: Number(w.looseKg ?? 0),
          kgFijo: Number(w.fixedKg ?? 0),
          metaCumplida: w.targetMet ?? false,
          diferencia: Number(w.difference ?? 0),
          jabasPorFruta: (w.processedByFruit ?? []).map((item) => ({ frutaId: item.fruitId, fruta: item.fruitName ?? `Fruta ${item.fruitId}`, jabas: Number(item.crates) })),
        }
      : null,
  }
}

/** Jornada completa por id (detalle + plan con los parámetros que usó). */
async function getJornada(id: number): Promise<Jornada> {
  const detalle = await apiRequest<RawWorkdayDetail>(`/workdays/${id}`)
  const [raw, areaMap] = await Promise.all([
    apiRequest<RawPlan>(`/plans/${detalle.planDay.planId}`),
    fetchAreaMap(),
  ])
  return toJornada(detalle, await toPlan(raw, areaMap), areaMap)
}

/**
 * DEMO: en false se puede iniciar y registrar cualquier día del plan (pasado o
 * futuro) sin esperar a su fecha y hora. En producción va en true.
 */
const VALIDAR_FECHA_HORA = false

export const httpJornadas: JornadasRepository = {
  async getActual(plantaId) {
    const planes = await planesDePlanta(plantaId)

    // El primer día sin cerrar del plan aprobado o en ejecución más antiguo.
    const activos = planes
      .filter(({ plan }) => plan.estado === "APROBADO" || plan.estado === "EN_EJECUCION")
      .reverse()
    for (const { raw, plan, areaMap } of activos) {
      const rawDia = raw.days.find((d) => !d.workday?.closedAt)
      if (!rawDia) continue
      const dia = diaDe(plan, rawDia.date)
      if (!rawDia.workday) return { plan, dia, jornada: null }
      const detalle = await apiRequest<RawWorkdayDetail>(`/workdays/${rawDia.workday.id}`)
      return { plan, dia, jornada: toJornada(detalle, plan, areaMap) }
    }

    // La semana terminó: se muestra el resultado de la última jornada cerrada.
    for (const { raw, plan, areaMap } of planes) {
      const rawDia = raw.days.findLast((d) => d.workday?.closedAt)
      if (!rawDia?.workday) continue
      const detalle = await apiRequest<RawWorkdayDetail>(`/workdays/${rawDia.workday.id}`)
      return { plan, dia: diaDe(plan, rawDia.date), jornada: toJornada(detalle, plan, areaMap) }
    }
    return null
  },

  async listarPlanes(plantaId) {
    const planes = await planesDePlanta(plantaId)
    return planes.map(({ raw, plan }) => ({
      plan,
      ejecucion: Object.fromEntries(raw.days.map((d) => [d.date, ejecucionDe(d.workday)])),
    }))
  },

  async iniciar(input) {
    const [raw, areaMap] = await Promise.all([
      apiRequest<RawPlan>(`/plans/${input.planId}`),
      fetchAreaMap(),
    ])
    const rawDia = raw.days.find((d) => d.date === input.fecha)
    if (!rawDia?.id) throw new ApiError("El día no pertenece al plan.", 400)
    if (rawDia.workday) throw new ApiError("La jornada de este día ya se inició.", 409)

    if (!Number.isInteger(input.trabajadores) || input.trabajadores < 1) {
      throw new ApiError("Indica con cuántas personas inicias.", 400)
    }
    if (!(input.jabasDia > 0)) throw new ApiError("Indica las toneladas que tienes.", 400)

    // El back pide asistencia por área: el total se reparte según el plan (llegaron = inician).
    const reparto = repartirPorArea(
      rawDia.areas.map((a) => ({ area: areaDe(areaMap, a.areaId), trabajadoresPlan: a.plannedWorkers })),
      input.trabajadores,
    )
    const attendance = rawDia.areas.map((a, i) => ({
      areaId: a.areaId,
      arrivedWorkers: reparto[i].trabajadores,
      startingWorkers: reparto[i].trabajadores,
    }))

    // Arranca a la hora programada; si todavía no llega, el back toma la hora actual
    // (en la demo siempre a la programada).
    const programada = aUtc(`${input.fecha}T${raw.parametersSnapshot.startTime.slice(0, 5)}`)
    const workday = await apiRequest<RawWorkday>("/workdays", {
      method: "POST",
      body: {
        planDayId: rawDia.id,
        startedAt: !VALIDAR_FECHA_HORA || Date.parse(programada) <= Date.now() ? programada : undefined,
        attendance,
      },
    })
    // Si la fruta que tiene no es la meta, queda como cambio de volumen al inicio.
    if (input.jabasDia !== Number(rawDia.targetCrates)) {
      await apiRequest(`/workdays/${workday.id}/records`, {
        method: "POST",
        body: { type: "VOLUMEN", recordedAt: workday.startedAt, expectedDailyCrates: input.jabasDia },
      })
    }
    return getJornada(workday.id)
  },

  async registrar(jornadaId, input) {
    const [jornada, areaMap] = await Promise.all([getJornada(jornadaId), fetchAreaMap()])
    if (jornada.estado !== "ABIERTA") throw new ApiError("La jornada ya está cerrada.", 409)

    const hora = horaDeJornada(jornada.fecha, jornada.horaInicio.slice(11, 16), input.hora)
    const ultimo = jornada.registros.at(-1)?.hora ?? jornada.horaInicio
    if (hora < ultimo) {
      throw new ApiError(`La hora no puede ser anterior a las ${ultimo.slice(11, 16)}.`, 400)
    }
    const recordedAt = aUtc(hora)
    if (VALIDAR_FECHA_HORA && Date.parse(recordedAt) > Date.now()) {
      throw new ApiError("La hora no puede ser posterior a la hora actual.", 400)
    }

    const body =
      input.tipo === "AVANCE"
        ? {
            cumulativeReceivedCrates: input.jabasRecibidasAcum,
            cumulativeProcessedCrates: input.jabasProcesadasAcum,
            processedByFruit: input.jabasPorFruta?.map((item) => ({ fruitId: item.frutaId, crates: item.jabas })),
          }
        : input.tipo === "PERSONAL"
          ? {
              areaId: areaIdDe(areaMap, input.area),
              staffChange: input.cambioPersonal,
            }
          : { expectedDailyCrates: input.jabasEsperadasDia }

    await apiRequest(`/workdays/${jornadaId}/records`, {
      method: "POST",
      body: { type: input.tipo, recordedAt, ...body },
    })
    return getJornada(jornadaId)
  },

  async ajustarHoras(jornadaId, input) {
    const detalle = await apiRequest<RawWorkdayDetail>(`/workdays/${jornadaId}`)
    await apiRequest(`/plan-days/${detalle.planDayId}/hours`, {
      method: "PATCH",
      body: { adjustedHours: input.horasActualizadas, reason: input.motivoAjuste },
    })
    return getJornada(jornadaId)
  },

  async cerrar(jornadaId, input) {
    await apiRequest(`/workdays/${jornadaId}/close`, {
      method: "POST",
      body: {
        workedHours: input.horasTrabajadas,
        processedCrates: input.jabasProcesadas,
        processedByFruit: input.jabasPorFruta?.map((item) => ({ fruitId: item.frutaId, crates: item.jabas })),
        discardedCrates: input.jabasDescarte,
        looseKg: input.kgLoose,
        fixedKg: input.kgFijo,
      },
    })
    return getJornada(jornadaId)
  },
}
