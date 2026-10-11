import { ClipboardList } from "lucide-react"
import { ParametrosResumen, describirCambios } from "@/components/shared/parametros-resumen"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import type { ParametrosPlanta, Plan } from "@/lib/domain"
import { ESCENARIO_LABEL } from "../lib/escenarios"
import { LocalDateTime } from "./local-date-time"
import { PlanAreasTable } from "./plan-dias-tables"
import { PlanKpis } from "./plan-kpis"
import { EnviarAprobacionButton } from "./enviar-aprobacion-button"

interface PlanOficialSectionProps {
  plan: Plan | null
  defaults: ParametrosPlanta
  canEnviar?: boolean
}

/** Plan oficial guardado, con el personal por área y los valores finales. */
export function PlanOficialSection({ plan, defaults, canEnviar = false }: PlanOficialSectionProps) {
  return (
    <Card id="planificacion-generada" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Planificación generada</CardTitle>
        <CardDescription>
          {plan ? (
            <>
              Guardado <LocalDateTime iso={plan.updatedAt} /> · cosecha{" "}
              {ESCENARIO_LABEL[plan.escenarioCosecha].toLowerCase()} ·{" "}
              {describirCambios(plan.parametrosUsados, defaults)}
            </>
          ) : (
            "Se crea con las proyecciones y los parámetros de la planta."
          )}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        {plan ? (
          <>
            <PlanKpis totales={plan.totales} />
            <ParametrosResumen valores={plan.parametrosUsados} defaults={defaults} />
            <PlanAreasTable dias={plan.dias} />
            <p className="text-sm text-muted-foreground">
              El total de trabajadores se reparte por área con la proporción de la semana 41.
            </p>
          </>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <ClipboardList />
              </EmptyMedia>
              <EmptyTitle>Aún no hay plan oficial</EmptyTitle>
              <EmptyDescription>
                Registra el programa comercial y la proyección de cosecha, y pulsa «Ver planificación».
                Después podrás enviarlo a aprobación.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
      {canEnviar && plan && <CardFooter className="justify-end"><EnviarAprobacionButton planId={plan.id} disabled={plan.estado !== "BORRADOR"} /></CardFooter>}
    </Card>
  )
}
