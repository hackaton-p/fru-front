import { Badge } from "@/components/ui/badge"
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"

interface PlanPasosProps {
  configuracionLista: boolean
  cosechaLista: boolean
  comercialLista: boolean
  planCreado: boolean
}

/** Flujo para iniciar un plan semanal a partir de sus proyecciones. */
export function PlanPasos({ configuracionLista, cosechaLista, comercialLista, planCreado }: PlanPasosProps) {
  const pasos = [
    {
      titulo: "Configurar planta",
      detalle: configuracionLista
        ? "Parámetros confirmados"
        : "Revisa los valores sugeridos en Configuración",
      listo: configuracionLista,
    },
    {
      titulo: "Cargar programa comercial",
      detalle: comercialLista ? "Programa comercial registrado" : "Importa Excel o agrega registros por cliente",
      listo: comercialLista,
    },
    {
      titulo: "Cargar proyección de cosecha",
      detalle: cosechaLista ? "Proyección de cosecha registrada" : "Importa Excel o distribuye el total entre los días",
      listo: cosechaLista,
    },
    {
      titulo: "Ver planificación",
      detalle: planCreado
        ? "Revisa el plan generado antes de enviarlo a aprobación"
        : "Completa las proyecciones para generar y revisar el plan",
      listo: planCreado,
    },
  ]

  return (
    <ItemGroup className="grid gap-2 md:grid-cols-4" aria-label="Flujo para crear el plan semanal">
      {pasos.map((paso, i) => (
        <Item key={paso.titulo} variant="outline" size="sm" className="bg-card">
          <ItemMedia>
            <Badge variant={paso.listo ? "default" : "secondary"} className="tabular-nums">
              {i + 1}
            </Badge>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{paso.titulo}</ItemTitle>
            <p className="text-xs text-muted-foreground">{paso.detalle}</p>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}
