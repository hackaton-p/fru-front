/*
 * Utilidades de fecha en UTC para trabajar con fechas ISO (YYYY-MM-DD) sin
 * desfases de zona horaria.
 */

const DAY_MS = 86_400_000

export function parseIsoDate(iso: string): Date {
  const [y, m, d] = iso.slice(0, 10).split("-").map(Number)
  return new Date(Date.UTC(y, m - 1, d))
}

export function toIsoDate(date: Date): string {
  return date.toISOString().slice(0, 10)
}

export function addDays(date: Date, days: number): Date {
  return new Date(date.getTime() + days * DAY_MS)
}

/** Semana ISO-8601 de una fecha. */
export function isoWeek(date: Date): { year: number; week: number } {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()))
  const day = d.getUTCDay() || 7
  d.setUTCDate(d.getUTCDate() + 4 - day)
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1)
  return { year: d.getUTCFullYear(), week: Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7) }
}

/** Lunes de la semana ISO indicada. */
export function mondayOfIsoWeek(year: number, week: number): Date {
  const jan4 = new Date(Date.UTC(year, 0, 4))
  const jan4Day = jan4.getUTCDay() || 7
  return addDays(jan4, (week - 1) * 7 - (jan4Day - 1))
}

export function planningDates(query: { fechas?: string[]; inicio?: string; cantidadDias?: number; anio: number; semana: number }): string[] {
  if (query.fechas) return [...query.fechas].sort()
  const start = query.inicio ? parseIsoDate(query.inicio) : mondayOfIsoWeek(query.anio, query.semana)
  return Array.from({ length: query.cantidadDias ?? 5 }, (_, i) => toIsoDate(addDays(start, i)))
}

export function nextPlanningMonday(now: Date): string {
  const parts = new Intl.DateTimeFormat("en-US", { timeZone: "America/Lima", year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(now)
  const value = (type: string) => Number(parts.find(part => part.type === type)!.value)
  const today = new Date(Date.UTC(value("year"), value("month") - 1, value("day")))
  return toIsoDate(addDays(today, 8 - (today.getUTCDay() || 7)))
}
