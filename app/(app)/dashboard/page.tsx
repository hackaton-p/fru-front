import { Suspense } from "react"
import { DashboardView } from "@/features/dashboard/components/dashboard-view"
import { getDashboard } from "@/features/dashboard/queries"

export const metadata = { title: "Dashboard de packing" }

async function DashboardContent({ searchParams }: Pick<PageProps<"/dashboard">, "searchParams">) {
  return <DashboardView data={await getDashboard(await searchParams)} />
}

export default function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  return <Suspense fallback={<p role="status" className="py-12 text-muted-foreground">Cargando dashboard de packing…</p>}><DashboardContent searchParams={searchParams} /></Suspense>
}
