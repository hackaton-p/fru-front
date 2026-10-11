import { Suspense } from "react"
import type { Metadata } from "next"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import { JornadaView, SoloJefeTurno } from "@/features/jornada/components/jornada-view"
import { JornadaSkeleton } from "@/features/jornada/components/jornada-skeleton"
import { getJornadaData } from "@/features/jornada/queries"

export const metadata: Metadata = {
  title: "Jefe de turno · Jornada",
}

async function Jornada() {
  const user = await getCurrentUser()
  if (!can(user.rol, "jornada:registrar")) return <SoloJefeTurno />
  const data = await getJornadaData(user)
  return <JornadaView data={data} />
}

export default function JefeTurnoPage() {
  return (
    <Suspense fallback={<JornadaSkeleton />}>
      <Jornada />
    </Suspense>
  )
}
