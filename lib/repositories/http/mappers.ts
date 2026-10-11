import { apiRequest } from "@/lib/api/http-client"
import { ApiError } from "@/lib/api/errors"
import {
  AREAS,
  type AreaCodigo,
  type CalcularPlanInput,
  type EscenarioCosecha,
  type EstadoDia,
  type EstadoPlan,
  type MotivoAjuste,
  type Plan,
  type PlanCalculado,
  type PlanDia,
  type PlanDiaArea,
  type PlanTotales,
  type Planta,
  type ParametrosPlanta,
} from "@/lib/domain"

/*
 * El back (NestJS) expone rutas y campos en inglés; los decimales llegan
 * como string. Estos tipos describen el JSON tal como llega por HTTP (no se
 * puede importar los DTOs del back, es otro repo) y las funciones mapean
 * ese contrato a los tipos de dominio del front, en español.
 */

export interface RawParameters {
  cratesPerWorkerHour: string
  maxWorkers: number
  shiftHours: string
  maxOvertimeHours: string
  startTime: string
  efficiencyFactor: string
  volumeTolerancePercent: string
}

export interface RawPlant extends RawParameters {
  id: number
  name: string
  updatedAt?: string | null
  configurationCompletedAt?: string | null
  isActive?: boolean
}

export interface RawFruit {
  id: number
  name: string
  isActive?: boolean
  plantIds?: number[]
}

export interface RawArea {
  id: number
  name: string
}

export interface RawCustomer {
  id: number
  name: string
}

export interface RawProjection {
  plantId: number
  fruitId: number
  customerId: number | null
  type: "COSECHA" | "COMERCIAL"
  year: number
  week: number
  date: string | null
  crates: string
}

export interface RawPlanDayArea {
  areaId: number
  plannedWorkers: number
  /** Solo en planes guardados, una vez iniciada la jornada. */
  arrivedWorkers?: number | null
  startingWorkers?: number | null
  presentWorkers?: number | null
}

/** Jornada (WORKDAY) tal como la devuelve el back; las fechas-hora llegan en UTC. */
export interface RawWorkday {
  id: number
  planDayId: number
  startedAt: string
  closedAt: string | null
  initialEstimatedHours: string | null
  expectedDailyCrates: string
  presentWorkers: number
  receivedCrates: string
  processedCrates: string
  processedByFruit?: { fruitId: number; fruitName?: string; crates: string }[]
  workedHours: string | null
  discardedCrates: string | null
  looseKg: string | null
  fixedKg: string | null
  targetMet: boolean | null
  difference: string | null
}

export interface RawPlanDay {
  /** Solo en planes guardados (no en la simulación). */
  id?: number
  adjustedHours?: string | null
  adjustmentReason?: string | null
  workday?: RawWorkday | null
  date: string
  targetCrates: string
  fruitTargets?: { fruitId: number; fruitName: string; crates: string }[]
  workers: number
  hours: string
  margin: number | null
  dayStatus: string
  areas: RawPlanDayArea[]
}

export interface RawTotals {
  targetCrates: string
  peakWorkers: number
  averageWorkers: number
  operatingHours: string
  commercialCoverage: number | null
}

export interface RawSimulation {
  parametersSnapshot: RawParameters
  hasModifiedParameters: boolean
  days: RawPlanDay[]
  totals: RawTotals
}

export interface RawPlan extends RawSimulation {
  id: number
  plantId: number
  fruitId: number | null
  year: number
  week: number
  harvestScenario: string
  status: string
  updatedAt: string
  submittedAt: string | null
  approvedAt?: string | null
  approvalComment: string | null
}

export interface RawPlanList {
  items: RawPlan[]
}

export interface RawPage<T> {
  items: T[]
}

export interface RawImportResult {
  imported: number
}

export function toParametros(p: RawParameters): ParametrosPlanta {
  return {
    rendimientoPersonaHora: Number(p.cratesPerWorkerHour),
    personalMaximo: p.maxWorkers,
    horasJornada: Number(p.shiftHours),
    horasExtraMax: Number(p.maxOvertimeHours),
    horaInicio: p.startTime.slice(0, 5),
    factorEficiencia: Number(p.efficiencyFactor),
    toleranciaVolumen: Number(p.volumeTolerancePercent),
  }
}

export function toRawParametros(p: ParametrosPlanta) {
  return {
    cratesPerWorkerHour: p.rendimientoPersonaHora,
    maxWorkers: p.personalMaximo,
    shiftHours: p.horasJornada,
    maxOvertimeHours: p.horasExtraMax,
    startTime: p.horaInicio,
    efficiencyFactor: p.factorEficiencia,
    volumeTolerancePercent: p.toleranciaVolumen,
  }
}

export function toPlanta(p: RawPlant): Planta {
  return {
    id: p.id,
    nombre: p.name,
    configuradaAt: p.configurationCompletedAt ?? null,
    updatedAt: p.updatedAt ?? null,
    activo: p.isActive ?? true,
    ...toParametros(p),
  }
}

export function toCreatePlanBody(input: CalcularPlanInput) {
  return {
    startDate: input.inicio,
    dayCount: input.cantidadDias,
    selectedDates: input.fechas,
    plantId: input.plantaId,
    year: input.anio,
    week: input.semana,
    harvestScenario: input.escenarioCosecha,
    parameters: toRawParametros(input.parametros),
  }
}

/** Las áreas son un catálogo libre en el back; en el front son un enum fijo. */
function normalizeAreaCode(name: string): AreaCodigo | null {
  const code = name
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toUpperCase()
  return (AREAS as readonly string[]).includes(code) ? (code as AreaCodigo) : null
}

export async function fetchAreaMap(): Promise<Record<number, AreaCodigo>> {
  const areas = await apiRequest<RawArea[]>("/areas")
  const map: Record<number, AreaCodigo> = {}
  for (const area of areas) {
    const code = normalizeAreaCode(area.name)
    if (code) map[area.id] = code
  }
  return map
}

export async function fetchCustomerMap(): Promise<Record<number, string>> {
  const page = await apiRequest<RawPage<RawCustomer>>("/customers", { query: { limit: 100 } })
  return Object.fromEntries(page.items.map((c) => [c.id, c.name]))
}

export async function fetchFruitMap(plantId: number): Promise<Record<number, string>> {
  const fruits = await apiRequest<RawFruit[]>("/fruits", { query: { plantId } })
  return Object.fromEntries(fruits.map((fruit) => [fruit.id, fruit.name]))
}

function toPlanDiaArea(a: RawPlanDayArea, areaMap: Record<number, AreaCodigo>): PlanDiaArea {
  const area = areaMap[a.areaId]
  if (!area) throw new ApiError(`Área desconocida en el back (id ${a.areaId})`, 500)
  return { area, trabajadoresPlan: a.plannedWorkers }
}

function toPlanDia(d: RawPlanDay, areaMap: Record<number, AreaCodigo>): PlanDia {
  return {
    fecha: d.date,
    jabasMeta: Number(d.targetCrates),
    frutaMeta: (d.fruitTargets ?? []).map((target) => ({ frutaId: target.fruitId, fruta: target.fruitName, jabasMeta: Number(target.crates) })),
    trabajadores: d.workers,
    horas: Number(d.hours),
    margen: d.margin ?? 0,
    estadoDia: d.dayStatus as EstadoDia,
    areas: d.areas.map((a) => toPlanDiaArea(a, areaMap)),
    horasActualizadas: d.adjustedHours == null ? null : Number(d.adjustedHours),
    motivoAjuste: (d.adjustmentReason as MotivoAjuste | null | undefined) ?? null,
  }
}

/** `operatingHours` es el total de la semana; el promedio diario no viene del back. */
function toPlanTotales(t: RawTotals, diasCount: number): PlanTotales {
  const horasTotal = Number(t.operatingHours)
  return {
    jabasMeta: Number(t.targetCrates),
    trabajadoresPico: t.peakWorkers,
    trabajadoresPromedio: t.averageWorkers,
    horasTotal,
    horasPromedio: diasCount ? horasTotal / diasCount : 0,
    cumplimientoComercial: t.commercialCoverage ?? 0,
  }
}

/** La simulación no persiste el escenario: se devuelve el mismo que se pidió. */
export async function toPlanCalculado(
  s: RawSimulation,
  escenarioCosecha: EscenarioCosecha,
): Promise<PlanCalculado> {
  const areaMap = await fetchAreaMap()
  const dias = s.days.map((d) => toPlanDia(d, areaMap))
  return {
    escenarioCosecha,
    parametrosUsados: toParametros(s.parametersSnapshot),
    parametrosModificados: s.hasModifiedParameters,
    dias,
    totales: toPlanTotales(s.totals, dias.length),
  }
}

export async function toPlan(
  p: RawPlan,
  areaMap?: Record<number, AreaCodigo>,
): Promise<Plan> {
  const areas = areaMap ?? (await fetchAreaMap())
  const dias = p.days.map((d) => toPlanDia(d, areas))
  return {
    id: p.id,
    plantaId: p.plantId,
    frutaId: p.fruitId ?? null,
    anio: p.year,
    semana: p.week,
    estado: p.status as EstadoPlan,
    updatedAt: p.updatedAt,
    fechaEnvio: p.submittedAt,
    fechaAprobacion: p.approvedAt ?? null,
    comentarioAprobacion: p.approvalComment,
    diasCerrados: p.days.filter((d) => d.workday?.closedAt).length,
    escenarioCosecha: p.harvestScenario as EscenarioCosecha,
    parametrosUsados: toParametros(p.parametersSnapshot),
    parametrosModificados: p.hasModifiedParameters,
    dias,
    totales: toPlanTotales(p.totals, dias.length),
  }
}
