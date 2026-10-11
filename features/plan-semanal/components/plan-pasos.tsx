import { Badge } from "@/components/ui/badge"
import { Item, ItemContent, ItemGroup, ItemMedia, ItemTitle } from "@/components/ui/item"

const PASOS = [
  "Simular con distintas cifras",
  "Aplicar la que te convence como plan oficial",
  "Enviar a aprobación",
]

/** Los tres pasos del flujo de planificación. */
export function PlanPasos() {
  return (
    <ItemGroup className="grid gap-2 md:grid-cols-3" aria-label="Pasos">
      {PASOS.map((paso, i) => (
        <Item key={paso} variant="outline" size="sm" className="bg-card">
          <ItemMedia>
            <Badge variant="secondary" className="tabular-nums">
              {i + 1}
            </Badge>
          </ItemMedia>
          <ItemContent>
            <ItemTitle>{paso}</ItemTitle>
          </ItemContent>
        </Item>
      ))}
    </ItemGroup>
  )
}
