import type { Metadata } from "next"
import { connection } from "next/server"
import { notFound } from "next/navigation"
import { getCurrentUser } from "@/lib/auth/session"
import { getAdministracionData } from "@/features/administracion/queries"
import { CatalogosView } from "@/features/administracion/components/catalogos-view"

export const metadata: Metadata = { title: "Administración de catálogos" }

export default async function AdministracionPage() {
  await connection()
  const user = await getCurrentUser()
  if (!["ADMIN", "SUBGERENTE", "JEFE_TURNO"].includes(user.rol)) notFound()
  return <CatalogosView data={await getAdministracionData(user)} />
}
