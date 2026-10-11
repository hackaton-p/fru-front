"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight, Pencil } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { SemanaQuery } from "@/lib/domain"
import { addDays, isoWeek, parseIsoDate, toIsoDate } from "@/lib/dates"
import { canSelectPlanningDate, defaultPlanningDates, isValidPlanningSelection, togglePlanningDate } from "../lib/planning-calendar"

export function PlanningPeriod({ query, locked, minimumMonday }: { query: SemanaQuery; locked: boolean; minimumMonday: string }) {
  const router = useRouter()
  const [start, setStart] = useState<string | null>(query.inicio ?? null)
  const [showCalendar, setShowCalendar] = useState(() => !locked && !isValidPlanningSelection(query.inicio, query.fechas, minimumMonday))
  const [selectedDates, setSelectedDates] = useState(() => query.fechas ?? (query.inicio ? defaultPlanningDates(query.inicio) : []))
  const [month, setMonth] = useState(() => {
    const date = parseIsoDate(query.inicio ?? minimumMonday)
    return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1))
  })
  const week = start ? isoWeek(parseIsoDate(start)) : null
  const valid = isValidPlanningSelection(start ?? undefined, selectedDates, minimumMonday)
  const minimumDate = parseIsoDate(minimumMonday)
  const minimumMonth = new Date(Date.UTC(minimumDate.getUTCFullYear(), minimumDate.getUTCMonth(), 1))
  const dateLabel = (date: string) => new Intl.DateTimeFormat("es-PE", { weekday: "long", day: "numeric", month: "long", year: "numeric", timeZone: "UTC" }).format(parseIsoDate(date))
  const offset = (month.getUTCDay() + 6) % 7
  const cells = Array.from({ length: Math.ceil((offset + new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + 1, 0)).getUTCDate()) / 7) * 7 }, (_, i) => {
    const date = addDays(month, i - offset)
    return { date: toIsoDate(date), number: date.getUTCDate(), currentMonth: date.getUTCMonth() === month.getUTCMonth() }
  })
  const moveMonth = (delta: number) => setMonth(new Date(Date.UTC(month.getUTCFullYear(), month.getUTCMonth() + delta, 1)))
  const continueWith = (monday: string, dates: string[]) => {
    if (!isValidPlanningSelection(monday, dates, minimumMonday)) return
    setShowCalendar(false)
    const selectedWeek = isoWeek(parseIsoDate(monday))
    router.push(`/planificador?vista=crear&planta=${query.plantaId}&fruta=${query.frutaId}&anio=${selectedWeek.year}&semana=${selectedWeek.week}&inicio=${monday}&fechas=${dates.join(",")}`)
  }
  const selectDay = (date: string) => {
    if (date < minimumMonday) return
    if (!start || date !== start && canSelectPlanningDate(date, null, minimumMonday)) {
      setStart(date)
      setSelectedDates(defaultPlanningDates(date))
      return
    }
    const next = togglePlanningDate(start, selectedDates, date)
    setSelectedDates(next)
  }
  return <section className="space-y-4 rounded-xl border bg-card p-4" aria-label="Seleccionar días de planificación">
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-full space-y-2 sm:min-w-0 sm:flex-1"><Label htmlFor="planning-start">Semana de planificación</Label><Input id="planning-start" readOnly disabled={locked} value={start && week ? `Semana ${week.week}, ${week.year} · ${dateLabel(start)}` : ""} placeholder="Selecciona un lunes en el calendario" /></div>
      <div className="space-y-2"><Label htmlFor="planning-days">Cantidad de días</Label><Input id="planning-days" type="number" value={start ? selectedDates.length : ""} disabled className="w-28" /></div>
      {!locked && (showCalendar
        ? <Button disabled={!valid || !start} onClick={() => { if (start) continueWith(start, selectedDates) }}>Continuar</Button>
        : <Button variant="outline" size="icon" aria-label="Editar semana y días" title="Editar semana y días" onClick={() => setShowCalendar(true)}><Pencil aria-hidden /></Button>)}
    </div>
    {!locked && showCalendar && <div className="max-w-sm rounded-xl border p-3">
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="icon" aria-label="Mes anterior" disabled={month <= minimumMonth} onClick={() => moveMonth(-1)}><ChevronLeft aria-hidden /></Button>
        <h2 className="font-semibold capitalize">{new Intl.DateTimeFormat("es-PE", { month: "long", year: "numeric", timeZone: "UTC" }).format(month)}</h2>
        <Button variant="ghost" size="icon" aria-label="Mes siguiente" onClick={() => moveMonth(1)}><ChevronRight aria-hidden /></Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center">
        {["Lu", "Ma", "Mi", "Ju", "Vi", "Sá", "Do"].map(day => <span key={day} className="py-1 text-xs text-muted-foreground">{day}</span>)}
        {cells.map(cell => {
          const selected = selectedDates.includes(cell.date)
          const fixed = cell.date === start
          const atMinimum = selected && selectedDates.length <= 2
          const enabled = (canSelectPlanningDate(cell.date, start, minimumMonday) || canSelectPlanningDate(cell.date, null, minimumMonday)) && !fixed && !atMinimum
          return <button type="button" key={cell.date} disabled={!enabled} aria-label={`${fixed ? "Lunes obligatorio" : start ? selected ? "Deseleccionar día" : "Seleccionar día" : "Seleccionar inicio"}: ${dateLabel(cell.date)}`} aria-pressed={selected} onClick={() => selectDay(cell.date)} className={`min-h-10 rounded-md text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed ${selected ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted disabled:opacity-30"} ${!selected && !cell.currentMonth ? "text-muted-foreground" : ""}`}>{cell.number}</button>
        })}
      </div>
    </div>}
    {(locked || showCalendar) && <p role="status" className="text-sm text-muted-foreground">{locked ? "Los días del plan guardado no pueden modificarse." : week ? "Marca o desmarca los días de martes a sábado, o elige otro lunes para cambiar de semana. El lunes es obligatorio y debes conservar al menos dos días." : "Selecciona un lunes para marcar automáticamente los días hasta el sábado. Después podrás desmarcar los que no deseas planificar."}</p>}
    {!locked && showCalendar && <p className="text-sm text-muted-foreground">Puedes planificar desde el {dateLabel(minimumMonday)}.</p>}
    {start && <p className="text-sm">Días seleccionados: {selectedDates.map(date => new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(parseIsoDate(date))).join(" · ")}</p>}
  </section>
}
