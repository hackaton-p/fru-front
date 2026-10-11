"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ForbiddenError, runAction, type ActionResult } from "@/lib/action-result"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import type { ParametrosPlanta, Planta } from "@/lib/domain"
import { parametrosSchema } from "@/lib/parametros"
import { getRepositories } from "@/lib/repositories"

const plantaIdSchema = z.number().int().positive()

/**
 * Guarda los valores por defecto de una planta. Solo afecta a simulaciones
 * nuevas: los planes guardados conservan sus `parametrosUsados`.
 */
export async function guardarPlantaAction(
  plantaId: number,
  parametros: ParametrosPlanta,
): Promise<ActionResult<Planta>> {
  return runAction(async () => {
    const id = plantaIdSchema.parse(plantaId)
    const valores = parametrosSchema.parse(parametros)
    const user = await getCurrentUser()
    if (!can(user.rol, "planta:editar")) throw new ForbiddenError()
    const planta = await getRepositories().plantas.actualizar(id, valores)
    revalidatePath("/configuracion")
    revalidatePath("/planificador")
    return planta
  })
}
