"use client"

import { useTransition } from "react"
import { CircleAlert, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Spinner } from "@/components/ui/spinner"
import type { ParametrosPlanta, Plan, Planta, SemanaQuery } from "@/lib/domain"
import { cn } from "@/lib/utils"
import { aplicarPlanAction } from "../../actions"
import { useSimulacion } from "../../hooks/use-simulacion"
import { estadoCambios, planEditable, type EstadoCambios } from "../../lib/plan-comparator"
import type { PlanSemanalData } from "../../queries"
import { PlanKpis } from "../plan-kpis"
import { SimulacionDiasTable } from "../plan-dias-tables"
import { EscenarioSelector } from "./escenario-selector"
import { ParametrosPlanPanel } from "./parametros-plan-panel"

const MENSAJE_CAMBIOS: Record<EstadoCambios, string> = {
  SIN_PLAN: "Todavía no aplicaste ninguna simulación.",
  IGUAL: "Esta simulación es igual al plan oficial.",
  CON_CAMBIOS: "Hay cambios que no están en el plan oficial.",
  BLOQUEADO: "El plan ya fue enviado; la simulación no puede reemplazarlo.",
}

interface SimulacionSectionProps {
  query: SemanaQuery
  planta: Planta
  defaults: ParametrosPlanta
  plan: Plan | null
  initial: NonNullable<PlanSemanalData["simulacionInicial"]>
  canGestionar: boolean
  proyeccionesListas: boolean
  configuracionLista: boolean
}

/** Paso 2 · Simulación: borrador que se recalcula en el back y no se guarda. */
export function SimulacionSection({
  query,
  planta,
  defaults,
  plan,
  initial,
  canGestionar,
  proyeccionesListas,
  configuracionLista,
}: SimulacionSectionProps) {
  const sim = useSimulacion({ query, defaults, initial })
  const [isApplying, startApplying] = useTransition()

  const estado = estadoCambios({ escenario: sim.escenario, parametros: sim.parametros.values }, plan)
  const fuentesListas = configuracionLista && proyeccionesListas
  const editable = canGestionar && planEditable(plan) && fuentesListas
  const canApply = editable && estado !== "IGUAL" && !sim.isStale && !sim.error && sim.input !== null

  const aplicar = () => {
    const input = sim.input
    if (!input) return
    startApplying(async () => {
      const res = await aplicarPlanAction(input)
      if (res.ok) {
        toast.success("Plan oficial guardado", { description: "Ya puedes enviarlo a aprobación." })
      } else {
        toast.error("No se pudo aplicar el plan", { description: res.error })
      }
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Paso 2 · Simulación</CardTitle>
        <CardDescription>
          El sistema cruza la cosecha proyectada con el programa comercial y calcula los recursos
          diarios. Ajusta parámetros y escenario; nada se guarda hasta que apliques el plan.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">Borrador · no guardado</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
        {!configuracionLista ? (
          <Alert>
            <TriangleAlert aria-hidden />
            <AlertTitle>Falta confirmar la configuración de la planta</AlertTitle>
            <AlertDescription>
              Revisa y guarda los parámetros sugeridos desde Configuración antes de simular o crear
              el plan.
            </AlertDescription>
          </Alert>
        ) : !proyeccionesListas ? (
          <Alert>
            <TriangleAlert aria-hidden />
            <AlertTitle>Completa las proyecciones para iniciar el plan</AlertTitle>
            <AlertDescription>
              Carga la proyección de cosecha y el programa comercial de esta semana. Con ambas bases
              listas podrás simular y crear el plan semanal.
            </AlertDescription>
          </Alert>
        ) : null}
        <ParametrosPlanPanel
          planta={planta}
          defaults={defaults}
          parametros={sim.parametros}
          disabled={!editable}
        />
        <EscenarioSelector value={sim.escenario} onChange={sim.setEscenario} disabled={!editable} />

        <Separator />

        {sim.error ? (
          <Alert>
            <CircleAlert aria-hidden />
            <AlertTitle>No se pudo recalcular la simulación</AlertTitle>
            <AlertDescription>{sim.error}</AlertDescription>
          </Alert>
        ) : null}

        {fuentesListas ? (
          <div
            aria-busy={sim.isStale}
            className={cn("flex flex-col gap-4 transition-opacity", sim.isStale && "opacity-60")}
          >
            <PlanKpis totales={sim.resultado.totales} />
            <SimulacionDiasTable dias={sim.resultado.dias} />
          </div>
        ) : null}

        {fuentesListas ? (
          <p className="text-sm text-muted-foreground">
            Trabajadores = jabas ÷ (rendimiento × eficiencia × horas de jornada), con tope en el
            personal máximo. El margen es cuánta fruta adicional se puede procesar dentro de la
            jornada más las horas extra permitidas.
          </p>
        ) : null}
      </CardContent>

      {canGestionar ? (
        <CardFooter className="flex-wrap justify-between gap-3">
          <p role="status" className="text-sm text-muted-foreground">
            {MENSAJE_CAMBIOS[estado]}
          </p>
          <Button disabled={!canApply || isApplying} onClick={aplicar}>
            {isApplying ? <Spinner data-icon="inline-start" /> : null}
            Aplicar como plan oficial
          </Button>
        </CardFooter>
      ) : null}
    </Card>
  )
}
