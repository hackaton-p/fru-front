import { addDays, parseIsoDate, toIsoDate } from "@/lib/dates"

export function canSelectPlanningDate(date: string, monday: string | null, minimumMonday?: string): boolean {
  const value = parseIsoDate(date)
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !Number.isFinite(value.getTime()) || toIsoDate(value) !== date) return false
  if (minimumMonday && date < minimumMonday) return false
  if (!monday) return value.getUTCDay() === 1
  if (!canSelectPlanningDate(monday, null, minimumMonday)) return false
  return date >= monday && date <= toIsoDate(addDays(parseIsoDate(monday), 5))
}

export function defaultPlanningDates(monday: string): string[] {
  return canSelectPlanningDate(monday, null)
    ? Array.from({ length: 6 }, (_, i) => toIsoDate(addDays(parseIsoDate(monday), i))) : []
}

export function isValidPlanningSelection(monday: string | undefined, dates: string[] | undefined, minimumMonday?: string): boolean {
  return Boolean(monday && dates && dates.length >= 2 && dates.length <= 6 &&
    new Set(dates).size === dates.length && dates.includes(monday) &&
    dates.every(date => canSelectPlanningDate(date, monday, minimumMonday)))
}

export function togglePlanningDate(monday: string, dates: string[], date: string): string[] {
  if (date === monday || !canSelectPlanningDate(date, monday)) return dates
  if (dates.includes(date)) return dates.length > 2 ? dates.filter(day => day !== date) : dates
  return [...dates, date].sort()
}
