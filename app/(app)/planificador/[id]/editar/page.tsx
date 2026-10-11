import { Suspense } from "react"
import type { Metadata } from "next"
import { PlanExistente } from "@/features/plan-semanal/components/plan-existente"
import { PlanSemanalSkeleton } from "@/features/plan-semanal/components/plan-semanal-skeleton"

export const metadata: Metadata = {
  title: "Planificador · Editar plan",
}

async function Contenido({ params }: Pick<PageProps<"/planificador/[id]/editar">, "params">) {
  const { id } = await params
  return <PlanExistente id={id} mode="editar" />
}

export default function Page({ params }: PageProps<"/planificador/[id]/editar">) {
  return (
    <Suspense fallback={<PlanSemanalSkeleton />}>
      <Contenido params={params} />
    </Suspense>
  )
}
