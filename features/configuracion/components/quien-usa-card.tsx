import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

/** A quién afectan los valores por defecto y desde cuándo. */
export function QuienUsaCard() {
  return (
    <Card className="gap-3 py-5 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="font-heading text-lg font-bold">Quién usa estos valores</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col gap-2.5 text-sm leading-relaxed">
        <p>
          <strong>Planificador:</strong> la simulación semanal parte de aquí y puede cambiarlos solo
          para un plan.
        </p>
        <p>
          <strong>Jefe de turno:</strong> la tolerancia y las horas extra deciden cuándo salta una
          alerta.
        </p>
        <p className="text-muted-foreground">
          Los planes ya guardados conservan los valores con que se crearon; un cambio aquí solo
          afecta a planes nuevos.
        </p>
      </CardContent>
    </Card>
  )
}
