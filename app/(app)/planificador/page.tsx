import { Suspense } from "react"
import type { Metadata } from "next"
import { connection } from "next/server"
import Link from "next/link"
import { notFound } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { addDays, isoWeek, mondayOfIsoWeek } from "@/lib/dates"
import { can } from "@/lib/auth/permissions"
import { parametrosDe } from "@/lib/domain"
import { parametrosSchema } from "@/lib/parametros"
import { getRepositories } from "@/lib/repositories"
import { planEditable } from "@/features/plan-semanal/lib/plan-comparator"
import { PlanificadorListView } from "@/features/plan-semanal/components/planes-list-view"
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
  const canGestionar = can(user.rol, "plan:gestionar")
  const mode = params.vista ?? (params.semana ? "crear" : "listado")
  if (mode === "listado") {
    const [planes, plantas] = await Promise.all([
      repos.planes.listar(user.plantaId !== null ? { plantaId: user.plantaId } : {}),
      repos.plantas.listar(),
    ])
    return <PlanificadorListView planes={planes} plantas={plantas.filter(p => user.plantaId === null || p.id === user.plantaId)} canGestionar={canGestionar} />
  }
  if (!["crear", "detalle", "editar"].includes(String(mode))) notFound()
  const planId = Number(params.plan)
  if (mode !== "crear" && (!Number.isSafeInteger(planId) || planId <= 0)) notFound()
  const selectedPlan = mode !== "crear" ? await repos.planes.getById(planId) : undefined
  if (selectedPlan && user.plantaId !== null && selectedPlan.plantaId !== user.plantaId) notFound()
  let query = selectedPlan
    ? { plantaId: selectedPlan.plantaId, frutaId: selectedPlan.frutaId, anio: selectedPlan.anio, semana: selectedPlan.semana }
    : resolverSemanaQuery(params, user, new Date())
  if (mode === "crear" && !params.semana && !params.anio) {
    // Sin semana explícita: salta a la primera semana que aún no tiene plan.
    const existentes = await repos.planes.listar({ plantaId: query.plantaId })
    let { year, week } = { year: query.anio, week: query.semana }
    while (existentes.some(p => p.frutaId === query.frutaId && p.anio === year && p.semana === week)) {
      ;({ year, week } = isoWeek(addDays(mondayOfIsoWeek(year, week), 7)))
    }
    query = { ...query, anio: year, semana: week }
  }
  const back = <Button asChild variant="outline" className="self-start"><Link href="/planificador">← Volver a planificaciones</Link></Button>
  if (mode === "crear") {
    if (!canGestionar) return <>{back}<Alert><AlertTitle>No tienes permiso para crear planes</AlertTitle></Alert></>
    const planta = await repos.plantas.getById(query.plantaId)
    if (!planta.configuradaAt || !parametrosSchema.safeParse(parametrosDe(planta)).success) {
      return <>{back}<Alert><AlertTitle>Configura la planta antes de crear la planificación</AlertTitle><AlertDescription><p>{planta.nombre} necesita sus parámetros por defecto completos y confirmados.</p><Button asChild className="mt-2"><Link href={`/configuracion?planta=${planta.id}`}>Configurar {planta.nombre}</Link></Button><Link href={`/planificador?vista=crear&planta=${planta.id}`} className="ml-4 text-primary underline underline-offset-4">Ya configuré la planta, continuar</Link></AlertDescription></Alert></>
    }
  }
  const readOnly = mode === "detalle" || !canGestionar || Boolean(selectedPlan && !planEditable(selectedPlan))
  const data = await getPlanSemanalData(query, selectedPlan)
  return <>{back}{selectedPlan && <div className="flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-muted-foreground">Plan #{selectedPlan.id} · {readOnly ? "Consulta" : "Edición"}</p>{mode === "detalle" && canGestionar && planEditable(selectedPlan) && <Button asChild><Link href={`/planificador?vista=editar&plan=${selectedPlan.id}`}>Modificar planificación</Link></Button>}</div>}<PlanSemanalView data={data} user={user} readOnly={readOnly} /></>
}

export default function PlanificadorPage({ searchParams }: PageProps<"/planificador">) {
  return (
    <Suspense fallback={<PlanSemanalSkeleton />}>
      <PlanSemanal searchParams={searchParams} />
    </Suspense>
  )
}
