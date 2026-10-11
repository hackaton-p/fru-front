"use client"

import { useTransition } from "react"
import { CircleAlert } from "lucide-react"
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
  initial: PlanSemanalData["simulacionInicial"]
  canGestionar: boolean
}

/** Paso 1 · Simulación: borrador que se recalcula en el back y no se guarda. */
export function SimulacionSection({
  query,
  planta,
  defaults,
  plan,
  initial,
  canGestionar,
}: SimulacionSectionProps) {
  const sim = useSimulacion({ query, defaults, initial })
  const [isApplying, startApplying] = useTransition()

  const estado = estadoCambios({ escenario: sim.escenario, parametros: sim.parametros.values }, plan)
  const editable = canGestionar && planEditable(plan)
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
        <CardTitle>Paso 1 · Simulación</CardTitle>
        <CardDescription>
          El sistema calcula cuántos trabajadores necesitas cada día con los parámetros del plan.
          Nada se guarda hasta que lo apliques.
        </CardDescription>
        <CardAction>
          <Badge variant="outline">Borrador · no guardado</Badge>
        </CardAction>
      </CardHeader>

      <CardContent className="flex flex-col gap-6">
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

        <div
          aria-busy={sim.isStale}
          className={cn("flex flex-col gap-4 transition-opacity", sim.isStale && "opacity-60")}
        >
          <PlanKpis totales={sim.resultado.totales} />
          <SimulacionDiasTable dias={sim.resultado.dias} />
        </div>

        <p className="text-sm text-muted-foreground">
          Trabajadores = jabas ÷ (rendimiento × eficiencia × horas de jornada), con tope en el
          personal máximo. El margen es cuánta fruta adicional se puede procesar dentro de la
          jornada más las horas extra permitidas.
        </p>
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
