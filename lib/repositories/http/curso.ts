import "server-only"
import { apiRequest } from "@/lib/api/http-client"
import { AREAS, type AreaCodigo, type CursoDia, type PersonalPorArea } from "@/lib/domain"
import type { CursoRepository } from "../types"
import { fetchAreaMap, type RawPlanDayArea, type RawWorkday } from "./mappers"

/*
 * Curso de la semana contra `GET /dashboard`: cada día del plan aprobado,
 * en ejecución o cerrado con su jornada (si la hubo). Solo los días con la
 * jornada cerrada traen valores ejecutados; los abiertos o pendientes van en null.
 */

interface RawDashboardDay {
  planId: number
  fruitId: number | null
  date: string
  targetCrates: string
  plannedWorkers: number
  workday: RawWorkday | null
  areas: RawPlanDayArea[]
}

interface RawDashboard {
  days: RawDashboardDay[]
}

const ratio = (a: number, b: number) => (b > 0 ? a / b : 0)

function porArea(
  areas: RawPlanDayArea[],
  areaMap: Record<number, AreaCodigo>,
  valor: (a: RawPlanDayArea) => number,
): PersonalPorArea {
  const total = Object.fromEntries(AREAS.map((a) => [a, 0])) as PersonalPorArea
  for (const a of areas) {
    const area = areaMap[a.areaId]
    if (area) total[area] += valor(a)
  }
  return total
}

function toCursoDia(d: RawDashboardDay, areaMap: Record<number, AreaCodigo>): CursoDia {
  const w = d.workday
  const cerrada = w?.closedAt ? w : null
  const procesadas = Number(cerrada?.processedCrates ?? 0)
  const loose = Number(cerrada?.looseKg ?? 0)
  const fijo = Number(cerrada?.fixedKg ?? 0)
  const llegaron = d.areas.reduce((s, a) => s + (a.arrivedWorkers ?? 0), 0)
  return {
    fecha: d.date,
    jabasProyectadas: Number(d.targetCrates),
    jabasEjecutadas: cerrada ? procesadas : null,
    horas: cerrada ? Number(cerrada.workedHours ?? 0) : null,
    pesoLoose: cerrada ? ratio(loose, loose + fijo) : null,
    descarte: cerrada ? ratio(Number(cerrada.discardedCrates ?? 0), procesadas) : null,
    personalProyectado: porArea(d.areas, areaMap, (a) => a.plannedWorkers),
    personalEjecutado: porArea(d.areas, areaMap, (a) => a.presentWorkers ?? 0),
    // El dashboard no trae los registros de personal de la jornada.
    ingresos: 0,
    // Quienes no llegaron respecto al plan (solo si la jornada ya empezó).
    ausentismo: w && d.plannedWorkers > 0 ? Math.max(0, 1 - llegaron / d.plannedWorkers) : 0,
  }
}

export const httpCurso: CursoRepository = {
  async getSemana(q) {
    const [raw, areaMap] = await Promise.all([
      apiRequest<RawDashboard>("/dashboard", {
        query: { plantId: q.plantaId, year: q.anio, week: q.semana },
      }),
      fetchAreaMap(),
    ])
    const dias = raw.days
      .filter((d) => d.fruitId === null || d.fruitId === q.frutaId)
      .sort((a, b) => a.date.localeCompare(b.date))
      .map((d) => toCursoDia(d, areaMap))
    if (dias.length === 0) return null
    return { ...q, fuente: "jornadas registradas por el jefe de turno", dias }
  },
}
