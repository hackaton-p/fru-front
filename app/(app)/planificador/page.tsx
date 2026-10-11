import { Suspense } from "react"
import type { Metadata } from "next"
import { connection } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { PlanSemanalSkeleton } from "@/features/plan-semanal/components/plan-semanal-skeleton"
import { PlanSemanalView } from "@/features/plan-semanal/components/plan-semanal-view"
import { getPlanSemanalData, resolverSemanaQuery } from "@/features/plan-semanal/queries"

export const metadata: Metadata = {
  title: "Planificador · Plan semanal",
}

async function PlanSemanal({ searchParams }: Pick<PageProps<"/planificador">, "searchParams">) {
  // La semana por defecto depende de la fecha de hoy: se calcula por request, no al prerenderizar.
  await connection()
  const [params, user] = await Promise.all([searchParams, getCurrentUser()])
  const query = resolverSemanaQuery(params, user, new Date())
  const data = await getPlanSemanalData(query)
  return <PlanSemanalView data={data} user={user} />
}

export default function PlanificadorPage({ searchParams }: PageProps<"/planificador">) {
  return (
    <Suspense fallback={<PlanSemanalSkeleton />}>
      <PlanSemanal searchParams={searchParams} />
    </Suspense>
  )
}
