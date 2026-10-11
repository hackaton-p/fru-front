import { EstadoPlanBadge } from "@/components/shared/estado-badges"
import type { EstadoPlan, Fruta, Planta, ProyeccionCosechaDia } from "@/lib/domain"
import { capitalize, formatDiaLargo } from "@/lib/format"
import { EnviarAprobacionButton } from "./enviar-aprobacion-button"

interface PlanHeaderProps {
  semana: number
  planta: Planta
  fruta: Fruta
  cosecha: ProyeccionCosechaDia[]
  planId: number | null
  estado: EstadoPlan | null
  canGestionar: boolean
}

function rangoFechas(cosecha: ProyeccionCosechaDia[]) {
  if (cosecha.length === 0) return null
  const fechas = cosecha.map((c) => c.fecha).sort()
  return `${capitalize(formatDiaLargo(fechas[0]))} a ${formatDiaLargo(fechas[fechas.length - 1])}`
}

export function PlanHeader({
  semana,
  planta,
  fruta,
  cosecha,
  planId,
  estado,
  canGestionar,
}: PlanHeaderProps) {
  const rango = rangoFechas(cosecha)
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Planta {planta.nombre} · {fruta.nombre}
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Plan semanal · Semana {semana}
        </h1>
        <p className="text-muted-foreground">
          {rango ? `${rango} · ` : ""}Cosecha y programa comercial en jabas
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-3">
        <EstadoPlanBadge estado={estado} />
        {canGestionar ? (
          <EnviarAprobacionButton planId={planId} disabled={estado !== "BORRADOR"} />
        ) : null}
      </div>
    </div>
  )
}
