"use client"

import { useState } from "react"
import Link from "next/link"
import type { DashboardData } from "../schema"
import { buildDashboard } from "../metrics"
import { DailyChart } from "./daily-chart"
import { MetricCard } from "./metric-card"

export function DashboardView({ data }: { data: DashboardData }) {
  const [plantId, setPlantId] = useState(data.plants[0].id)
  const plant = data.plants.find(p => p.id === plantId) ?? data.plants[0]
  const { metrics, insights, charts } = buildDashboard(plant)
  const pending = plant.days.filter(d => !d.closed).map(d => d.label)
  return <div className="flex flex-col gap-6 pb-8">
    <div className="flex flex-wrap items-end justify-between gap-4">
      <div><h1 className="font-heading text-[34px] leading-10 font-bold">Dashboard de packing · <span className="text-primary">{plant.label}</span></h1><p className="mt-0.5 text-[15px] text-muted-foreground">Semana {data.week} · {data.period} · Fuente: {data.source}{pending.length > 0 ? ` · En curso: ${pending.join(", ")}` : " · Semana cerrada"}</p></div>
      <div className="flex flex-wrap items-center gap-3 text-sm font-bold"><span>Planta</span><div role="group" aria-label="Planta" className="flex flex-wrap gap-1 rounded-full bg-card p-1">{data.plants.map(p => <button key={p.id} type="button" aria-pressed={plant.id === p.id} onClick={() => setPlantId(p.id)} className={`min-h-10 rounded-full px-[18px] transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${plant.id === p.id ? "bg-[#1f1f1f] text-white dark:bg-primary" : "hover:bg-muted"}`}>{p.name}</button>)}</div><span className="rounded-full bg-card px-4 py-2.5">Semana {data.week}</span></div>
    </div>
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">{metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}</div>
    <section className="flex flex-col gap-3.5 rounded-[20px] bg-[#1f1f1f] p-6 text-white" aria-labelledby="attention-title"><h2 id="attention-title" className="self-start rounded-full bg-[#e2483c] px-[18px] py-1 font-heading text-[19px] font-bold">Puntos de atención</h2><div className="grid gap-4 md:grid-cols-3">{insights.map(insight => <article key={insight.title} className="flex flex-col gap-1.5 rounded-2xl bg-[#2a2a2a] p-4"><h3 className="font-bold text-[#7bd394]">{insight.title}</h3><p className="text-[15px] leading-[22px] text-[#e4e6e4]">{insight.text}</p></article>)}</div></section>
    <div className="grid gap-6 lg:grid-cols-2">{charts.map(chart => <DailyChart key={`${plant.id}-${chart.id}`} chart={chart} days={plant.days.map(d => d.label)} />)}</div>
    <p className="text-[13px] text-muted-foreground">Pasa el cursor o el foco por cada día para ver el detalle. El detalle completo en tabla está en la vista <Link href="/subgerente/curso" className="text-primary underline underline-offset-2">Curso de la semana del subgerente</Link>. Rendimiento = jabas procesadas ÷ (personal × horas).</p>
  </div>
}
