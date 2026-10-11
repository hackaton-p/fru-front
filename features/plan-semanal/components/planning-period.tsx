"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { CalendarDays, ChevronLeft, ChevronRight } from "lucide-react"
import { Popover as PopoverPrimitive } from "radix-ui"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import type { SemanaQuery } from "@/lib/domain"
import { addDays, isoWeek, parseIsoDate, toIsoDate } from "@/lib/dates"
import { canSelectPlanningDate, defaultPlanningDates, isValidPlanningSelection, togglePlanningDate } from "../lib/planning-calendar"

export function PlanningPeriod({ query, locked, minimumMonday }: { query: SemanaQuery; locked: boolean; minimumMonday: string }) {
  const router = useRouter()
  const [start, setStart] = useState<string | null>(query.inicio ?? null)
  const [showCalendar, setShowCalendar] = useState(false)
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
  const changed = start !== (query.inicio ?? null) || selectedDates.join(",") !== (query.fechas ?? []).join(",")
  const shortDay = (date: string) => new Intl.DateTimeFormat("es-PE", { weekday: "short", day: "numeric", month: "short", timeZone: "UTC" }).format(parseIsoDate(date))
  return <section className="space-y-4 rounded-xl border bg-card p-4" aria-label="Seleccionar días de planificación">
    <div className="flex flex-wrap items-end gap-4">
      <div className="w-full space-y-2 sm:min-w-0 sm:flex-1">
        <Label htmlFor="planning-start">Semana de planificación</Label>
        <PopoverPrimitive.Root open={!locked && showCalendar} onOpenChange={setShowCalendar}>
          <PopoverPrimitive.Anchor asChild>
            <div className="relative">
              <Input id="planning-start" readOnly disabled={locked} className="cursor-pointer pr-9" role="combobox" aria-haspopup="dialog" aria-expanded={showCalendar} value={start && week ? `Semana ${week.week}, ${week.year} · ${dateLabel(start)}` : ""} placeholder="Haz clic para elegir un lunes y los días" onClick={() => !locked && setShowCalendar(true)} onKeyDown={e => { if (!locked && (e.key === "Enter" || e.key === " " || e.key === "ArrowDown")) { e.preventDefault(); setShowCalendar(true) } }} />
              <CalendarDays className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
            </div>
          </PopoverPrimitive.Anchor>
          <PopoverPrimitive.Portal>
            <PopoverPrimitive.Content align="start" sideOffset={6} onOpenAutoFocus={e => e.preventDefault()} className="z-50 w-80 max-w-[calc(100vw-2rem)] space-y-3 rounded-xl border bg-popover p-3 text-popover-foreground shadow-lg outline-none">
              <div className="flex items-center justify-between">
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
                  return <button type="button" key={cell.date} disabled={!enabled} aria-label={`${fixed ? "Lunes obligatorio" : start ? selected ? "Deseleccionar día" : "Seleccionar día" : "Seleccionar inicio"}: ${dateLabel(cell.date)}`} aria-pressed={selected} onClick={() => selectDay(cell.date)} className={`min-h-9 rounded-md text-sm tabular-nums focus-visible:outline-2 focus-visible:outline-ring disabled:cursor-not-allowed ${selected ? "bg-primary font-semibold text-primary-foreground" : "hover:bg-muted disabled:opacity-30"} ${!selected && !cell.currentMonth ? "text-muted-foreground" : ""}`}>{cell.number}</button>
                })}
              </div>
              <p role="status" className="text-xs text-muted-foreground">{start ? `Días: ${selectedDates.map(shortDay).join(" · ")}. El lunes es obligatorio; conserva al menos dos días.` : `Elige un lunes (desde el ${dateLabel(minimumMonday)}); se marcan los días hasta el sábado y puedes desmarcar los que no uses.`}</p>
              <Button className="w-full" disabled={!valid || !start} onClick={() => { if (start) continueWith(start, selectedDates) }}>Continuar</Button>
            </PopoverPrimitive.Content>
          </PopoverPrimitive.Portal>
        </PopoverPrimitive.Root>
      </div>
      <div className="space-y-2"><Label htmlFor="planning-days">Cantidad de días</Label><Input id="planning-days" type="number" value={start ? selectedDates.length : ""} disabled className="w-28" /></div>
      {!locked && changed && <Button disabled={!valid || !start} onClick={() => { if (start) continueWith(start, selectedDates) }}>Continuar</Button>}
    </div>
    {locked && <p role="status" className="text-sm text-muted-foreground">Los días del plan guardado no pueden modificarse.</p>}
    {start && <p className="text-sm">Días seleccionados: {selectedDates.map(shortDay).join(" · ")}</p>}
  </section>
}
