"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ForbiddenError, runAction, type ActionResult } from "@/lib/action-result"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import type { Plan } from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"

const COMENTARIO_MAX = 500

const planIdSchema = z.number().int().positive()

const comentarioSchema = z
  .string()
  .trim()
  .min(1, "Escribe un comentario para rechazar el plan.")
  .max(COMENTARIO_MAX, `El comentario admite hasta ${COMENTARIO_MAX} caracteres.`)

async function assertPuedeAprobar() {
  const user = await getCurrentUser()
  if (!can(user.rol, "plan:aprobar")) throw new ForbiddenError()
}

/** La decisión cambia la lista, el contador de pendientes y lo que ve el planificador. */
function revalidar() {
  revalidatePath("/subgerente", "layout")
  revalidatePath("/planificador")
}

/** PENDIENTE → APROBADO: las metas diarias quedan fijas. */
export async function aprobarPlanAction(planId: number): Promise<ActionResult<Plan>> {
  return runAction(async () => {
    const id = planIdSchema.parse(planId)
    await assertPuedeAprobar()
    const plan = await getRepositories().planes.aprobar(id)
    revalidar()
    return plan
  })
}

/** PENDIENTE → RECHAZADO: vuelve al planificador con el comentario. */
export async function rechazarPlanAction(
  planId: number,
  comentario: string,
): Promise<ActionResult<Plan>> {
  return runAction(async () => {
    const id = planIdSchema.parse(planId)
    const texto = comentarioSchema.parse(comentario)
    await assertPuedeAprobar()
    const plan = await getRepositories().planes.rechazar(id, texto)
    revalidar()
    return plan
  })
}
