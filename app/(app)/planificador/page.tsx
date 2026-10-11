import { Suspense } from "react"
import type { Metadata } from "next"
import { connection } from "next/server"
import Link from "next/link"
import { notFound, redirect } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { can } from "@/lib/auth/permissions"
import { parametrosDe } from "@/lib/domain"
import { parametrosSchema } from "@/lib/parametros"
import { getRepositories } from "@/lib/repositories"
import { nextPlanningMonday } from "@/lib/dates"
import { PlanificadorListView } from "@/features/plan-semanal/components/planes-list-view"
import { PlanningPeriod } from "@/features/plan-semanal/components/planning-period"
import { canSelectPlanningDate, isValidPlanningSelection } from "@/features/plan-semanal/lib/planning-calendar"
import { getCurrentUser } from "@/lib/auth/session"
import { PlanSemanalSkeleton } from "@/features/plan-semanal/components/plan-semanal-skeleton"
import { PlanSemanalView } from "@/features/plan-semanal/components/plan-semanal-view"
import { getPlanSemanalData, resolverSemanaQuery } from "@/features/plan-semanal/queries"

export const metadata: Metadata = {
  title: "Planificador · Planificaciones",
}

async function PlanSemanal({ searchParams }: Pick<PageProps<"/planificador">, "searchParams">) {
  // La semana por defecto depende de la fecha de hoy: se calcula por request, no al prerenderizar.
  await connection()
  const [params, user] = await Promise.all([searchParams, getCurrentUser()])
  const repos = getRepositories()
  const minimumMonday = nextPlanningMonday(new Date())
  const canGestionar = can(user.rol, "plan:gestionar")
  const mode = params.vista ?? (params.semana ? "crear" : "listado")
  if (mode === "listado") {
    const [planes, plantas] = await Promise.all([
      repos.planes.listar(user.plantaId !== null ? { plantaId: user.plantaId } : {}),
      repos.plantas.listar(),
    ])
    return <PlanificadorListView planes={planes} plantas={plantas.filter(p => user.plantaId === null || p.id === user.plantaId)} canGestionar={canGestionar} />
  }
  // URLs antiguas (?vista=detalle|editar&plan=2) → /planificador/2[/editar].
  if (mode === "detalle" || mode === "editar") {
    const planId = Number(params.plan)
    if (!Number.isSafeInteger(planId) || planId <= 0) notFound()
    redirect(mode === "editar" ? `/planificador/${planId}/editar` : `/planificador/${planId}`)
  }
  if (mode !== "crear") notFound()
  const query = resolverSemanaQuery(params, user, new Date())
  const back = <Button asChild variant="outline" className="self-start"><Link href="/planificador">← Volver a planificaciones</Link></Button>
  if (!canGestionar) return <>{back}<Alert><AlertTitle>No tienes permiso para crear planes</AlertTitle></Alert></>
  const planta = await repos.plantas.getById(query.plantaId)
  if (!planta.configuradaAt || !parametrosSchema.safeParse(parametrosDe(planta)).success) {
    return <>{back}<Alert><AlertTitle>Configura la planta antes de crear la planificación</AlertTitle><AlertDescription><p>{planta.nombre} necesita sus parámetros por defecto completos y confirmados.</p><Button asChild className="mt-2"><Link href={`/configuracion?planta=${planta.id}`}>Configurar {planta.nombre}</Link></Button><Link href={`/planificador?vista=crear&planta=${planta.id}`} className="ml-4 text-primary underline underline-offset-4">Ya configuré la planta, continuar</Link></AlertDescription></Alert></>
  }
  const start = typeof params.inicio === "string" && canSelectPlanningDate(params.inicio, null, minimumMonday) ? params.inicio : undefined
  if (!isValidPlanningSelection(start, query.fechas, minimumMonday)) {
    const fruta = await repos.frutas.getById(query.frutaId)
    return <>{back}<div><p className="text-sm text-muted-foreground">Planta {planta.nombre} · {fruta.nombre}</p><h1 className="font-heading text-3xl font-bold">Nueva planificación</h1><p className="text-muted-foreground">Elige un lunes y selecciona los días de esa semana que deseas planificar. Mínimo dos días, incluyendo el lunes.</p></div><PlanningPeriod key={start ?? "nuevo"} query={{ ...query, inicio: start, cantidadDias: undefined, fechas: undefined }} locked={false} minimumMonday={minimumMonday} /></>
  }
  const data = await getPlanSemanalData(query, undefined, true)
  return <>{back}<PlanSemanalView data={data} user={user} readOnly={false} minimumMonday={minimumMonday} /></>
}

export default function PlanificadorPage({ searchParams }: PageProps<"/planificador">) {
  return (
    <Suspense fallback={<PlanSemanalSkeleton />}>
      <PlanSemanal searchParams={searchParams} />
    </Suspense>
  )
}
