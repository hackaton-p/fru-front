import { notFound } from "next/navigation"
import { connection } from "next/server"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import { nextPlanningMonday } from "@/lib/dates"
import { getRepositories } from "@/lib/repositories"
import { planEditable } from "../lib/plan-comparator"
import { getPlanSemanalData } from "../queries"
import { PlanSemanalView } from "./plan-semanal-view"

interface PlanExistenteProps {
  id: string
  mode: "detalle" | "editar"
}

/** Plan guardado, identificado por su id en la URL: consulta (`/planificador/2`) o edición (`/planificador/2/editar`). */
export async function PlanExistente({ id, mode }: PlanExistenteProps) {
  await connection()
  const planId = Number(id)
  if (!Number.isSafeInteger(planId) || planId <= 0) notFound()
  const user = await getCurrentUser()
  const repos = getRepositories()
  const selectedPlan = await repos.planes.getById(planId)
  if (user.plantaId !== null && selectedPlan.plantaId !== user.plantaId) notFound()
  const canGestionar = can(user.rol, "plan:gestionar")
  const editable = canGestionar && planEditable(selectedPlan)
  const readOnly = mode === "detalle" || !editable
  const query = {
    plantaId: selectedPlan.plantaId,
    frutaId: selectedPlan.frutaId ?? 1,
    anio: selectedPlan.anio,
    semana: selectedPlan.semana,
    inicio: selectedPlan.dias[0]?.fecha,
    cantidadDias: selectedPlan.dias.length,
    fechas: selectedPlan.dias.map(day => day.fecha).sort(),
  }
  const data = await getPlanSemanalData(query, selectedPlan)
  return (
    <>
      <Button asChild variant="outline" className="self-start"><Link href="/planificador">← Volver a planificaciones</Link></Button>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">Plan #{selectedPlan.id} · {readOnly ? "Consulta" : "Edición"}</p>
        {mode === "detalle" && editable && <Button asChild><Link href={`/planificador/${selectedPlan.id}/editar`}>Modificar planificación</Link></Button>}
      </div>
      <PlanSemanalView data={data} user={user} readOnly={readOnly} minimumMonday={nextPlanningMonday(new Date())} />
    </>
  )
}
