import { ParametrosResumen, describirCambios } from "@/components/shared/parametros-resumen"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { ParametrosPlanta, Plan } from "@/lib/domain"
import { ESCENARIO_LABEL } from "../lib/escenarios"
import { LocalDateTime } from "./local-date-time"
import { PlanAreasTable } from "./plan-dias-tables"
import { PlanKpis } from "./plan-kpis"

interface PlanOficialSectionProps {
  plan: Plan
  defaults: ParametrosPlanta
}

/** Plan oficial guardado, con el personal por área y los valores finales. */
export function PlanOficialSection({ plan, defaults }: PlanOficialSectionProps) {
  return (
    <Card id="planificacion-generada" className="scroll-mt-20">
      <CardHeader>
        <CardTitle>Planificación generada</CardTitle>
        <CardDescription>
          Guardado <LocalDateTime iso={plan.updatedAt} /> · cosecha{" "}
          {ESCENARIO_LABEL[plan.escenarioCosecha].toLowerCase()} ·{" "}
          {describirCambios(plan.parametrosUsados, defaults)}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-col gap-4">
        <PlanKpis totales={plan.totales} />
        <ParametrosResumen valores={plan.parametrosUsados} defaults={defaults} />
        <PlanAreasTable dias={plan.dias} />
        <p className="text-sm text-muted-foreground">
          El total de trabajadores se reparte por área con la proporción de la semana 41.
        </p>
      </CardContent>
    </Card>
  )
}
