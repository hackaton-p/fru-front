import { Suspense } from "react"
import type { Metadata } from "next"
import { connection } from "next/server"
import { getCurrentUser } from "@/lib/auth/session"
import { ConfiguracionSkeleton } from "@/features/configuracion/components/configuracion-skeleton"
import { ConfiguracionView } from "@/features/configuracion/components/configuracion-view"
import { getConfiguracionData } from "@/features/configuracion/queries"

export const metadata: Metadata = {
  title: "Configuración de planta",
}

async function Configuracion({ searchParams }: Pick<PageProps<"/configuracion">, "searchParams">) {
  const user = await getCurrentUser()
  // El día de ejemplo sale de la próxima semana: depende de la fecha de hoy.
  await connection()
  const data = await getConfiguracionData(user, new Date())
  const params = await searchParams
  const requestedPlant = Number(params.planta)
  if (data.plantas.some(p => p.id === requestedPlant) && (user.plantaId === null || user.plantaId === requestedPlant)) data.plantaInicial = requestedPlant
  return <ConfiguracionView data={data} />
}

export default function ConfiguracionPage({ searchParams }: PageProps<"/configuracion">) {
  return (
    <Suspense fallback={<ConfiguracionSkeleton />}>
      <Configuracion searchParams={searchParams} />
    </Suspense>
  )
}
