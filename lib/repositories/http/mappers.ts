import { apiRequest } from "@/lib/api/http-client"
import { ApiError } from "@/lib/api/errors"
import {
  AREAS,
  type AreaCodigo,
  type CalcularPlanInput,
  type EscenarioCosecha,
  type EstadoDia,
  type EstadoPlan,
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
}

export interface RawFruit {
  id: number
  name: string
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
}

export interface RawPlanDay {
  date: string
  targetCrates: string
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
  fruitId: number
  year: number
  week: number
  harvestScenario: string
  status: string
  updatedAt: string
  submittedAt: string | null
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
    ...toParametros(p),
  }
}

export function toCreatePlanBody(input: CalcularPlanInput) {
  return {
    startDate: input.inicio,
    dayCount: input.cantidadDias,
    selectedDates: input.fechas,
    plantId: input.plantaId,
    fruitId: input.frutaId,
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

function toPlanDiaArea(a: RawPlanDayArea, areaMap: Record<number, AreaCodigo>): PlanDiaArea {
  const area = areaMap[a.areaId]
  if (!area) throw new ApiError(`Área desconocida en el back (id ${a.areaId})`, 500)
  return { area, trabajadoresPlan: a.plannedWorkers }
}

function toPlanDia(d: RawPlanDay, areaMap: Record<number, AreaCodigo>): PlanDia {
  return {
    fecha: d.date,
    jabasMeta: Number(d.targetCrates),
    trabajadores: d.workers,
    horas: Number(d.hours),
    margen: d.margin ?? 0,
    estadoDia: d.dayStatus as EstadoDia,
    areas: d.areas.map((a) => toPlanDiaArea(a, areaMap)),
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

export async function toPlan(p: RawPlan): Promise<Plan> {
  const areaMap = await fetchAreaMap()
  const dias = p.days.map((d) => toPlanDia(d, areaMap))
  return {
    id: p.id,
    plantaId: p.plantId,
    frutaId: p.fruitId,
    anio: p.year,
    semana: p.week,
    estado: p.status as EstadoPlan,
    updatedAt: p.updatedAt,
    fechaEnvio: p.submittedAt,
    comentarioAprobacion: p.approvalComment,
    escenarioCosecha: p.harvestScenario as EscenarioCosecha,
    parametrosUsados: toParametros(p.parametersSnapshot),
    parametrosModificados: p.hasModifiedParameters,
    dias,
    totales: toPlanTotales(p.totals, dias.length),
  }
}
