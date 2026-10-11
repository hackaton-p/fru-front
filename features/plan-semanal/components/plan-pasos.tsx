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
  const proyeccionesListas = cosechaLista && comercialLista
  const detalleProyecciones = proyeccionesListas
    ? "Cosecha y programa comercial listos"
    : !cosechaLista && !comercialLista
      ? "Carga la proyección de cosecha y el plan comercial"
      : cosechaLista
        ? "Falta cargar el programa comercial"
        : "Falta cargar la proyección de cosecha"
  const pasos = [
    {
      titulo: "Configurar planta",
      detalle: configuracionLista
        ? "Parámetros confirmados"
        : "Revisa los valores sugeridos en Configuración",
      listo: configuracionLista,
    },
    {
      titulo: "Revisar proyecciones",
      detalle: detalleProyecciones,
      listo: proyeccionesListas,
    },
    {
      titulo: "Simular el plan semanal",
      detalle: planCreado
        ? "Simulación aplicada al plan oficial"
        : configuracionLista && proyeccionesListas
          ? "Prueba escenarios y ajusta parámetros"
          : "Se habilita al completar los pasos 1 y 2",
      listo: planCreado,
    },
    {
      titulo: "Crear plan oficial",
      detalle: planCreado
        ? "Plan listo; puedes enviarlo a aprobación"
        : "Guarda la simulación; después podrás enviarlo a aprobación",
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
