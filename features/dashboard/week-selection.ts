import { addDays, isoWeek, mondayOfIsoWeek } from "@/lib/dates"

export interface DashboardWeek { year: number; week: number }
export type DashboardSearchParams = Record<string, string | string[] | undefined>

export function resolveDashboardWeek(params: DashboardSearchParams, now = new Date()): DashboardWeek {
  const localDate = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit",
  }).format(now)
  const current = isoWeek(new Date(`${localDate}T12:00:00Z`))
  const year = typeof params.anio === "string" ? Number(params.anio) : current.year
  const week = typeof params.semana === "string" ? Number(params.semana) : current.week
  if (!Number.isInteger(year) || year < 2000 || year > 2100 || !Number.isInteger(week)
    || week < 1 || week > isoWeek(new Date(Date.UTC(year, 11, 28))).week) return current
  return { year, week }
}

export function dashboardWeekOptions(year: number) {
  const format = new Intl.DateTimeFormat("es-PE", {
    timeZone: "UTC", day: "2-digit", month: "2-digit", year: "numeric",
  })
  return Array.from({ length: isoWeek(new Date(Date.UTC(year, 11, 28))).week }, (_, index) => {
    const week = index + 1
    const start = mondayOfIsoWeek(year, week)
    return { value: `${year}-${week}`, label: `Semana ${week} · ${format.format(start)} al ${format.format(addDays(start, 6))}` }
  })
}
