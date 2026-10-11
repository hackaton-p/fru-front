import { Suspense } from "react"
import type { Metadata } from "next"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"
import { getAdministracionData } from "@/features/administracion/queries"
import { CatalogosView } from "@/features/administracion/components/catalogos-view"

export const metadata: Metadata = { title: "Administración de catálogos" }

async function Administracion() {
  await connection()
  const user = await getCurrentUser()
  if (!["ADMIN", "SUBGERENTE", "JEFE_TURNO"].includes(user.rol)) notFound()
  return <CatalogosView data={await getAdministracionData(user)} />
}

export default function AdministracionPage() {
  return (
    <Suspense fallback={<main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6"><Skeleton className="h-9 w-72" /><Skeleton className="h-64 w-full" /></main>}>
      <Administracion />
    </Suspense>
  )
}
