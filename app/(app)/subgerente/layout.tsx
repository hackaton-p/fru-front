import { Suspense } from "react"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"
import { SubgerenteTabs } from "@/features/subgerente/components/subgerente-tabs"
import { contarPendientes } from "@/features/subgerente/queries"

async function TabsConPendientes() {
  const user = await getCurrentUser()
  return <SubgerenteTabs pendientes={await contarPendientes(user)} />
}

/** Subgerente · Planes y curso: una pantalla con dos pestañas. */
export default function SubgerenteLayout({ children }: LayoutProps<"/subgerente">) {
  return (
    <>
      <Suspense fallback={<Skeleton className="h-9 w-80 max-w-full rounded-full" />}>
        <TabsConPendientes />
      </Suspense>
      {children}
    </>
  )
}
