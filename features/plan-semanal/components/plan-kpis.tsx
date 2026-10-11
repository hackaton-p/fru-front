import { StatCard } from "@/components/shared/stat-card"
import type { PlanTotales } from "@/lib/domain"
import { formatDecimal, formatHoras, formatInt, formatPercent } from "@/lib/format"

/** KPIs de un plan: meta, trabajadores, horas y cumplimiento comercial. */
export function PlanKpis({ totales }: { totales: PlanTotales }) {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <StatCard label="Meta de la semana" value={formatInt(totales.jabasMeta)} hint="jabas" />
      <StatCard
        label="Trabajadores calculados"
        value={formatInt(totales.trabajadoresPico)}
        hint={`pico de la semana · promedio ${formatInt(totales.trabajadoresPromedio)}`}
      />
      <StatCard
        label="Horas de operación"
        value={formatHoras(totales.horasTotal)}
        hint={`promedio ${formatDecimal(totales.horasPromedio)} h por día`}
      />
      <StatCard
        label="Cumplimiento comercial"
        value={formatPercent(totales.cumplimientoComercial)}
        negative={totales.cumplimientoComercial < 1}
        hint="meta / programa comercial"
      />
    </div>
  )
}
