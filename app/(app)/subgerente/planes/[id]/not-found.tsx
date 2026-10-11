import Link from "next/link"
import { ArrowLeft, SearchX } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function PlanNoEncontrado() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <SearchX />
        </EmptyMedia>
        <EmptyTitle>No encontramos este plan</EmptyTitle>
        <EmptyDescription>
          Puede que el enlace esté mal o que el plan aún no se haya enviado a aprobación.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button asChild variant="outline">
          <Link href="/subgerente/planes">
            <ArrowLeft data-icon="inline-start" aria-hidden />
            Volver a planes
          </Link>
        </Button>
      </EmptyContent>
    </Empty>
  )
}
