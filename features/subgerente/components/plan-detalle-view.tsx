import Link from "next/link"
import { ArrowLeft, ChartColumn, CircleCheck, CircleX, Info, Lock } from "lucide-react"
import { ParametrosResumen } from "@/components/shared/parametros-resumen"
import { EstadoPlanBadge } from "@/components/shared/estado-badges"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertaPlanificacion } from "@/features/plan-semanal/components/alerta-planificacion"
import { PlanAreasTable } from "@/features/plan-semanal/components/plan-dias-tables"
import { PlanKpis } from "@/features/plan-semanal/components/plan-kpis"
import { can } from "@/lib/auth/permissions"
import { parametrosDe, type Plan, type Usuario } from "@/lib/domain"
import { formatRangoFechas } from "@/lib/format"
import { parametrosDistintos } from "@/lib/parametros"
import type { PlanDetalleData } from "../queries"
import { DecisionPlanCard } from "./decision-plan-card"
import { nombrePlanta } from "./planes-list-view"
import { PlanNota } from "./plan-nota"

function fuenteParametros(n: number) {
  if (n === 0) return "Iguales a los valores por defecto de la planta."
  return `${n} valor${n > 1 ? "es" : ""} cambiado${n > 1 ? "s" : ""} por el planificador respecto al default de la planta.`
}

/** Qué pasó con el plan cuando ya no está pendiente. */
function ResultadoPlan({ plan }: { plan: Plan }) {
  switch (plan.estado) {
    case "APROBADO":
      return (
        <Alert>
          <CircleCheck aria-hidden />
          <AlertTitle>Aprobaste este plan</AlertTitle>
          <AlertDescription>
            <p>Las metas quedaron fijas y el jefe de turno ya puede ejecutarlo.</p>
          </AlertDescription>
        </Alert>
      )
    case "EN_EJECUCION":
      return (
        <Alert>
          <Info aria-hidden />
          <AlertTitle>Plan en ejecución</AlertTitle>
          <AlertDescription>
            <p>Su avance diario está en «Curso de la semana».</p>
          </AlertDescription>
          <AlertAction>
            <Button asChild size="sm" variant="outline">
              <Link href={`/subgerente/curso?plan=${plan.id}`}>
                <ChartColumn data-icon="inline-start" aria-hidden />
                Ver curso
              </Link>
            </Button>
          </AlertAction>
        </Alert>
      )
    case "RECHAZADO":
      return (
        <Alert variant="destructive">
          <CircleX aria-hidden />
          <AlertTitle>Devolviste este plan al planificador</AlertTitle>
          <AlertDescription>
            <p>{plan.comentarioAprobacion ? `«${plan.comentarioAprobacion}»` : "Sin comentario."}</p>
          </AlertDescription>
        </Alert>
      )
    case "CERRADO":
      return (
        <Alert>
          <Lock aria-hidden />
          <AlertTitle>Semana cerrada</AlertTitle>
          <AlertDescription>
            <p>Todas las jornadas de este plan ya se cerraron.</p>
          </AlertDescription>
        </Alert>
      )
    default:
      return null
  }
}

interface PlanDetalleViewProps {
  data: PlanDetalleData
  user: Usuario
}

/** Subgerente · detalle del plan: lo que se aprueba y la decisión. */
export function PlanDetalleView({ data, user }: PlanDetalleViewProps) {
  const { plan, planta, fruta } = data
  const defaults = parametrosDe(planta)
  const cambiados = parametrosDistintos(plan.parametrosUsados, defaults).length
  const { jabasMeta, cumplimientoComercial } = plan.totales
  // El plan guarda meta ÷ programa comercial; de ahí sale el total comercial.
  const comercialJabas =
    cumplimientoComercial > 0 ? Math.round(jabasMeta / cumplimientoComercial) : 0
  const puedeDecidir = plan.estado === "PENDIENTE" && can(user.rol, "plan:aprobar")

  return (
    <>
      <div>
        <Button asChild variant="ghost" className="-ml-2.5">
          <Link href="/subgerente/planes">
            <ArrowLeft data-icon="inline-start" aria-hidden />
            Volver a planes
          </Link>
        </Button>
      </div>

      <div className="flex flex-col gap-2">
        <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
          {nombrePlanta(planta)} · <span className="text-primary">Semana {plan.semana}</span>
        </h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <EstadoPlanBadge estado={plan.estado} />
          <p className="text-muted-foreground">
            {formatRangoFechas(plan.dias.map((d) => d.fecha))} · {fruta?.nombre ?? "Todas las frutas"} ·{" "}
            <PlanNota plan={plan} />
          </p>
        </div>
      </div>

      <AlertaPlanificacion cosechaJabas={jabasMeta} comercialJabas={comercialJabas} />

      <PlanKpis totales={plan.totales} />

      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Plan diario</CardTitle>
          <CardDescription>
            Personal por área con la proporción de la semana 41 · jornada de{" "}
            {plan.parametrosUsados.horasJornada} h
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <p className="text-sm font-medium">Valores usados en el plan</p>
            <ParametrosResumen valores={plan.parametrosUsados} defaults={defaults} />
            <p className="text-sm text-muted-foreground">{fuenteParametros(cambiados)}</p>
          </div>
          <PlanAreasTable dias={plan.dias} conMargen />
        </CardContent>
      </Card>

      {puedeDecidir ? (
        <DecisionPlanCard planId={plan.id} hayBrecha={comercialJabas > jabasMeta} />
      ) : (
        <ResultadoPlan plan={plan} />
      )}
    </>
  )
}
