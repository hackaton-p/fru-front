import Link from "next/link"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { EstadoPlanBadge } from "@/components/shared/estado-badges"
import { addDays, isoWeek, mondayOfIsoWeek } from "@/lib/dates"
import type { EstadoPlan, Fruta, Planta, ProyeccionCosechaDia } from "@/lib/domain"
import { capitalize, formatDiaLargo } from "@/lib/format"
import { EnviarAprobacionButton } from "./enviar-aprobacion-button"

interface PlanHeaderProps {
  anio: number
  semana: number
  planta: Planta
  fruta: Fruta
  frutas: Fruta[]
  cosecha: ProyeccionCosechaDia[]
  planId: number | null
  estado: EstadoPlan | null
  canGestionar: boolean
  canEnviar?: boolean
  canCambiarSemana?: boolean
  canCambiarFruta?: boolean
  inicio?: string
  cantidadDias?: number
  fechas?: string[]
  minimumMonday?: string
}

function hrefSemana(anio: number, semana: number, plantaId: number, frutaId: number, offset: -1 | 1) {
  const lunes = mondayOfIsoWeek(anio, semana)
  const objetivo = isoWeek(addDays(lunes, offset * 7))
  return `/planificador?vista=crear&planta=${plantaId}&fruta=${frutaId}&anio=${objetivo.year}&semana=${objetivo.week}&inicio=${mondayOfIsoWeek(objetivo.year, objetivo.week).toISOString().slice(0, 10)}`
}

function rangoFechas(cosecha: ProyeccionCosechaDia[]) {
  if (cosecha.length === 0) return null
  const fechas = cosecha.map((c) => c.fecha).sort()
  return `${capitalize(formatDiaLargo(fechas[0]))} a ${formatDiaLargo(fechas[fechas.length - 1])}`
}

export function PlanHeader({
  anio,
  semana,
  planta,
  fruta,
  frutas,
  cosecha,
  planId,
  estado,
  canGestionar,
  canEnviar = canGestionar,
  canCambiarSemana = canGestionar,
  canCambiarFruta = canGestionar,
  inicio,
  cantidadDias = 5,
  fechas,
  minimumMonday,
}: PlanHeaderProps) {
  const rango = fechas ? rangoFechas(fechas.map(fecha => ({ fecha, jabas: 0 }))) : inicio ? rangoFechas(Array.from({ length: cantidadDias }, (_, index) => ({ fecha: addDays(new Date(`${inicio}T00:00:00Z`), index).toISOString().slice(0, 10), jabas: 0 }))) : rangoFechas(cosecha)
  const canPrevious = !minimumMonday || addDays(mondayOfIsoWeek(anio, semana), -7).toISOString().slice(0, 10) >= minimumMonday
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex flex-col gap-1">
        <p className="text-sm text-muted-foreground">
          Planta {planta.nombre} · Plan semanal general
        </p>
        <h1 className="font-heading text-3xl font-bold tracking-tight">
          Planificador · Semana {semana}, {anio}
        </h1>
        <p className="text-muted-foreground">
          {rango ? `${rango} · ` : ""}{fechas ? `${fechas.length} días seleccionados · ` : ""}Pedido agrupado por cliente y fruta · jabas
        </p>
        {canCambiarFruta ? <nav aria-label="Fruta para cargar" className="flex flex-wrap gap-2 pt-2">
          <span className="self-center text-sm text-muted-foreground">Cargar fruta:</span>
          {frutas.map((item) => <Link key={item.id} aria-current={item.id === fruta.id ? "page" : undefined} href={`/planificador?vista=crear&planta=${planta.id}&fruta=${item.id}&anio=${anio}&semana=${semana}&inicio=${inicio ?? mondayOfIsoWeek(anio, semana).toISOString().slice(0, 10)}${fechas ? `&fechas=${fechas.join(",")}` : ""}`} className={`rounded-full border px-3 py-1 text-sm ${item.id === fruta.id ? "border-primary bg-primary/10 font-semibold text-primary" : "text-muted-foreground hover:text-foreground"}`}>{item.nombre}</Link>)}
        </nav> : null}
      </div>
      <div className="flex flex-wrap items-center gap-3">
        {canCambiarSemana && <div className="flex items-center gap-1" aria-label="Cambiar semana">
          <Button asChild={canPrevious} disabled={!canPrevious} variant="outline" size="icon" aria-label="Semana anterior">
            {canPrevious ? <Link href={hrefSemana(anio, semana, planta.id, fruta.id, -1)}>
              <ChevronLeft aria-hidden />
            </Link> : <ChevronLeft aria-hidden />}
          </Button>
          <Button asChild variant="outline" size="icon" aria-label="Semana siguiente">
            <Link href={hrefSemana(anio, semana, planta.id, fruta.id, 1)}>
              <ChevronRight aria-hidden />
            </Link>
          </Button>
        </div>}
        <EstadoPlanBadge estado={estado} />
        {canEnviar && planId !== null ? (
          <EnviarAprobacionButton planId={planId} disabled={estado !== "BORRADOR"} />
        ) : null}
      </div>
    </div>
  )
}
