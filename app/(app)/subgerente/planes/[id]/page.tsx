import { Suspense } from "react"
import type { Metadata } from "next"
import { notFound } from "next/navigation"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import { PlanDetalleView } from "@/features/subgerente/components/plan-detalle-view"
import { SoloSubgerente } from "@/features/subgerente/components/solo-subgerente"
import { SubgerenteSkeleton } from "@/features/subgerente/components/subgerente-skeleton"
import { getPlanDetalleData } from "@/features/subgerente/queries"

export const metadata: Metadata = {
  title: "Subgerente · Detalle del plan",
}

async function PlanDetalle({ params }: Pick<PageProps<"/subgerente/planes/[id]">, "params">) {
  const [{ id }, user] = await Promise.all([params, getCurrentUser()])
  if (!can(user.rol, "plan:aprobar")) return <SoloSubgerente />
  const planId = Number(id)
  if (!Number.isInteger(planId) || planId <= 0) notFound()
  const data = await getPlanDetalleData(planId, user)
  return <PlanDetalleView data={data} user={user} />
}

export default function PlanDetallePage({ params }: PageProps<"/subgerente/planes/[id]">) {
  return (
    <Suspense fallback={<SubgerenteSkeleton label="Cargando plan" kpis={4} />}>
      <PlanDetalle params={params} />
    </Suspense>
  )
}
