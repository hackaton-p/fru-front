import { Suspense } from "react"
import type { Metadata } from "next"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import { PlanesListView } from "@/features/subgerente/components/planes-list-view"
import { SoloSubgerente } from "@/features/subgerente/components/solo-subgerente"
import { SubgerenteSkeleton } from "@/features/subgerente/components/subgerente-skeleton"
import { parseFiltroEstado } from "@/features/subgerente/lib/estados"
import { getPlanesData } from "@/features/subgerente/queries"

export const metadata: Metadata = {
  title: "Subgerente · Planes",
}

async function Planes({ searchParams }: Pick<PageProps<"/subgerente/planes">, "searchParams">) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()])
  if (!can(user.rol, "plan:aprobar")) return <SoloSubgerente />
  const data = await getPlanesData(user)
  return <PlanesListView data={data} filtro={parseFiltroEstado(params.estado)} />
}

export default function PlanesPage({ searchParams }: PageProps<"/subgerente/planes">) {
  return (
    <Suspense fallback={<SubgerenteSkeleton label="Cargando planes" />}>
      <Planes searchParams={searchParams} />
    </Suspense>
  )
}
