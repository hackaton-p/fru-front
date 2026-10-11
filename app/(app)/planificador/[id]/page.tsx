import { Suspense } from "react"
import type { Metadata } from "next"
import { PlanExistente } from "@/features/plan-semanal/components/plan-existente"
import { PlanSemanalSkeleton } from "@/features/plan-semanal/components/plan-semanal-skeleton"

export const metadata: Metadata = {
  title: "Planificador · Plan",
}

async function Contenido({ params }: Pick<PageProps<"/planificador/[id]">, "params">) {
  const { id } = await params
  return <PlanExistente id={id} mode="detalle" />
}

export default function Page({ params }: PageProps<"/planificador/[id]">) {
  return (
    <Suspense fallback={<PlanSemanalSkeleton />}>
      <Contenido params={params} />
    </Suspense>
  )
}
