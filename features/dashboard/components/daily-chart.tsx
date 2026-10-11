"use client"

import { useState } from "react"
import type { ChartDefinition } from "../metrics"

function niceMax(value: number) {
  const power = 10 ** Math.floor(Math.log10(Math.max(value, 1)))
  return ([1, 2, 2.5, 5, 10].find(n => n >= value / power) ?? 10) * power
}

/** Barras accesibles por teclado, con el mismo detalle que al pasar el cursor. */
export function DailyChart({ chart, days }: { chart: ChartDefinition; days: string[] }) {
  const [hovered, setHovered] = useState<number | null>(null)
  const [focused, setFocused] = useState<number | null>(null)
  const selected = hovered ?? focused
  const max = Math.max(chart.max ?? niceMax(Math.max(1, ...chart.series.flatMap(s => s.values.filter(v => v !== null))) * 1.05), chart.reference?.value ?? 0, ...chart.series.flatMap(s => s.values.filter(v => v !== null)))
  const format = (value: number) => value.toLocaleString("en-US", { maximumFractionDigits: 2 }) + (chart.unit ?? "")
  const detail = (index: number) => `${days[index]} · ${chart.series.map(s => `${s.label}: ${s.values[index] === null ? "en curso" : format(s.values[index]!)}`).join(" · ")}`
  return <section className="flex min-w-0 flex-col gap-3.5 rounded-[20px] bg-card p-5 sm:p-6" aria-labelledby={`${chart.id}-title`}>
    <div className="flex flex-wrap items-start justify-between gap-2">
      <div><h2 id={`${chart.id}-title`} className="font-heading text-xl font-bold">{chart.title}</h2><p className="text-[13px] text-muted-foreground">{chart.description}</p></div>
      {chart.series.length > 1 && <div className="flex flex-wrap gap-3.5 text-[13px] text-muted-foreground">{chart.series.map(s => <span key={s.label} className="flex items-center gap-1.5"><span className="size-3 rounded-[3px]" style={{ background: s.color }} aria-hidden />{s.label}</span>)}</div>}
    </div>
    <div className="mt-3 flex gap-2">
      <div className="relative h-[200px] w-11 shrink-0 text-xs text-muted-foreground" aria-hidden>{[0, .5, 1].map(t => <span key={t} className="absolute right-0 translate-y-1/2 tabular-nums" style={{ bottom: `${t * 100}%` }}>{format(max * t)}</span>)}</div>
      <div className="relative h-[200px] min-w-0 flex-1 border-b border-muted-foreground/50">
        {[0, .5, 1].map(t => <div key={t} className="absolute inset-x-0 border-t border-border/40" style={{ bottom: `${t * 100}%` }} aria-hidden />)}
        <div className="absolute inset-0 flex gap-1.5">{days.map((day, i) => <button key={day} type="button" aria-label={detail(i)} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} onFocus={() => setFocused(i)} onBlur={() => setFocused(null)} onClick={() => setFocused(i)} className={`flex min-w-0 flex-1 items-end justify-center gap-0.5 rounded-t-lg px-1.5 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${selected === i ? "bg-muted" : "bg-transparent"}`}>
          {chart.series.map(s => <span key={s.label} aria-hidden className="block w-full max-w-[30px] rounded-t" style={{ height: s.values[i] === null ? 6 : Math.max(2, s.values[i]! / max * 200), background: s.values[i] === null ? "transparent" : s.color, border: s.values[i] === null ? "1.5px dashed var(--muted-foreground)" : undefined }} />)}
        </button>)}</div>
        {chart.reference && <div className="pointer-events-none absolute inset-x-0 border-t-2 border-dashed border-destructive" style={{ bottom: `${chart.reference.value / max * 100}%` }}><span className="absolute right-1 bottom-1 bg-card px-1 text-xs font-bold text-destructive">{chart.reference.label}</span></div>}
      </div>
    </div>
    <div className="flex gap-1.5 pl-[52px] text-center text-[13px] text-muted-foreground">{days.map(day => <span key={day} className="min-w-0 flex-1">{day}</span>)}</div>
    <p role="status" aria-live="polite" className="flex min-h-11 items-center rounded-xl bg-background px-3.5 py-2 text-sm">{selected === null ? chart.summary : detail(selected)}</p>
  </section>
}
