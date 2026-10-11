"use client"

import { useState } from "react"
import Link from "next/link"
import type { DashboardData } from "../schema"
import { buildDashboard } from "../metrics"
import { DailyChart } from "./daily-chart"
import { MetricCard } from "./metric-card"
import { WeeklyFlowCard } from "./weekly-flow-card"
import { DashboardHeader } from "./dashboard-header"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export function DashboardView({ data }: { data: DashboardData }) {
  const [plantId, setPlantId] = useState(data.plants[0].id)
  const plant = data.plants.find(p => p.id === plantId) ?? data.plants[0]
  const { metrics, insights, charts } = buildDashboard(plant)
  const hasPlan = plant.hasPlan ?? plant.days.some(day => day.projectedCrates > 0 || day.projectedStaff > 0)
  return <div className="flex flex-col gap-6 pb-8">
    <DashboardHeader year={data.year} week={data.week} period={data.period} plants={data.plants} selectedPlant={plant} onPlantChange={setPlantId} />
    {!hasPlan && <Alert>
      <AlertTitle>Crea la planificación semanal</AlertTitle>
      <AlertDescription>
        <p>Aún no hay una planificación aprobada para {plant.name} en la semana {data.week}. Los indicadores se muestran en cero hasta registrar datos.</p>
        <Link href={`/planificador?planta=${plant.id}&anio=${data.year}&semana=${data.week}`} className="font-semibold text-primary underline underline-offset-4">Crear planificación →</Link>
      </AlertDescription>
    </Alert>}
    <WeeklyFlowCard summary={plant.weeklyFlow ?? { plannedCrates: 0, arrivedCrates: 0 }} />
    <div className="grid grid-cols-1 gap-4 min-[420px]:grid-cols-2 md:grid-cols-3 xl:grid-cols-6">{metrics.map(metric => <MetricCard key={metric.label} metric={metric} />)}</div>
    <section className="flex flex-col gap-3.5 rounded-[20px] bg-[#1f1f1f] p-6 text-white" aria-labelledby="attention-title"><h2 id="attention-title" className="self-start rounded-full bg-[#e2483c] px-[18px] py-1 font-heading text-[19px] font-bold">Puntos de atención</h2><div className="grid gap-4 md:grid-cols-3">{insights.map(insight => <article key={insight.title} className="flex flex-col gap-1.5 rounded-2xl bg-[#2a2a2a] p-4"><h3 className="font-bold text-[#7bd394]">{insight.title}</h3><p className="text-[15px] leading-[22px] text-[#e4e6e4]">{insight.text}</p></article>)}</div></section>
    <div className="grid gap-6 lg:grid-cols-2">{charts.map(chart => <DailyChart key={`${plant.id}-${chart.id}`} chart={chart} days={plant.days.map(d => d.label)} />)}</div>
    <footer className="flex flex-wrap items-start justify-between gap-3 border-t border-border/60 pt-4 text-xs text-muted-foreground">
      <Link href="/subgerente/curso" className="font-semibold text-primary underline-offset-4 hover:underline">Ver detalle de la semana →</Link>
      <details className="max-w-lg">
        <summary className="cursor-pointer rounded-sm focus-visible:outline-2 focus-visible:outline-ring">Información de los datos</summary>
        <div className="mt-2 space-y-1 leading-relaxed">
          <p>Fuente: {data.source}.</p>
          <p>Los indicadores incluyen solo jornadas cerradas. Rendimiento = jabas procesadas ÷ (personal × horas).</p>
          <p>Selecciona un día en los gráficos para ver su detalle.</p>
        </div>
      </details>
    </footer>
  </div>
}
