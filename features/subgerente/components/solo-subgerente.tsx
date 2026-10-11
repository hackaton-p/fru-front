import { ShieldCheck } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

/** Se muestra cuando otro rol entra a una pantalla del subgerente. */
export function SoloSubgerente() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <ShieldCheck />
        </EmptyMedia>
        <EmptyTitle>Esta pantalla es del subgerente</EmptyTitle>
        <EmptyDescription>
          Aquí se aprueban los planes y se sigue la semana. Elige «Subgerente» en «Ver como» para
          verla.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}
