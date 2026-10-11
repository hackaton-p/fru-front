import { Suspense } from "react"
import type { Metadata } from "next"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import { CursoView } from "@/features/subgerente/components/curso-view"
import { SoloSubgerente } from "@/features/subgerente/components/solo-subgerente"
import { SubgerenteSkeleton } from "@/features/subgerente/components/subgerente-skeleton"
import { getCursoData } from "@/features/subgerente/queries"

export const metadata: Metadata = {
  title: "Subgerente · Curso de la semana",
}

async function Curso({ searchParams }: Pick<PageProps<"/subgerente/curso">, "searchParams">) {
  const [params, user] = await Promise.all([searchParams, getCurrentUser()])
  if (!can(user.rol, "plan:aprobar")) return <SoloSubgerente />
  const data = await getCursoData(params, user, new Date())
  return <CursoView data={data} />
}

export default function CursoPage({ searchParams }: PageProps<"/subgerente/curso">) {
  return (
    <Suspense fallback={<SubgerenteSkeleton label="Cargando curso de la semana" kpis={5} />}>
      <Curso searchParams={searchParams} />
    </Suspense>
  )
}
