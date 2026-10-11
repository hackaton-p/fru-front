import type { Planta } from "@/lib/domain"
import { addDays, mondayOfIsoWeek, toIsoDate } from "@/lib/dates"
import type { DashboardData } from "./schema"

export interface DashboardResponse {
  year: number
  week: number
  days: {
    plantId: number
    date: string
    targetCrates: string
    plannedWorkers: number
    workday: {
      closedAt: string | null
      processedCrates: string
      receivedCrates: string
      workedHours: string
      presentWorkers: number
      discardedCrates: string
    } | null
  }[]
}

export function mapDashboard(response: DashboardResponse, plants: Planta[]): DashboardData {
  const monday = mondayOfIsoWeek(response.year, response.week)
  const dates = Array.from({ length: 7 }, (_, index) => toIsoDate(addDays(monday, index)))
  const label = (date: string) => new Intl.DateTimeFormat("es-PE", {
    weekday: "short", day: "2-digit", timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`))
  const period = (date: string) => `${date.slice(8, 10)}/${date.slice(5, 7)}`
  return {
    week: response.week,
    period: `${period(dates[0])} al ${period(dates[6])}`,
    source: "planificación y jornadas de packing",
    plants: plants.map(plant => {
      const rows = response.days.filter(day => day.plantId === plant.id)
      return {
        id: String(plant.id), name: plant.nombre, label: plant.nombre,
        shiftHours: plant.horasJornada, defaultYield: plant.rendimientoPersonaHora,
        hasPlan: rows.length > 0,
        weeklyFlow: {
          plannedCrates: rows.reduce((sum, day) => sum + Number(day.targetCrates), 0),
          arrivedCrates: rows.reduce((sum, day) => sum + Number(day.workday?.receivedCrates ?? 0), 0),
        },
        days: dates.map(date => {
          const days = rows.filter(day => day.date === date)
          const workdays = days.flatMap(day => day.workday ? [day.workday] : [])
          const processed = workdays.reduce((sum, day) => sum + Number(day.processedCrates), 0)
          return {
            label: label(date),
            closed: days.length > 0 && days.every(day => Boolean(day.workday?.closedAt)),
            projectedCrates: days.reduce((sum, day) => sum + Number(day.targetCrates), 0),
            projectedStaff: days.reduce((sum, day) => sum + day.plannedWorkers, 0),
            executedCrates: workdays.length ? processed : null,
            executedStaff: workdays.length ? workdays.reduce((sum, day) => sum + day.presentWorkers, 0) : null,
            hours: workdays.length ? Math.max(...workdays.map(day => Number(day.workedHours))) : null,
            discardPercent: workdays.length ? (processed > 0
              ? workdays.reduce((sum, day) => sum + Number(day.discardedCrates), 0) / processed * 100 : 0) : null,
          }
        }),
      }
    }),
  }
}
