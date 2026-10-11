"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ForbiddenError, runAction, type ActionResult } from "@/lib/action-result"
import { getCurrentUser } from "@/lib/auth/session"
import type { Fruta, FrutaCatalogoInput, Planta } from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"

const plantSchema = z.object({ id: z.number().int().positive().optional(), nombre: z.string().trim().min(1).max(255), activo: z.boolean().default(true) })
const fruitSchema = z.object({ id: z.number().int().positive().optional(), nombre: z.string().trim().min(1).max(255), plantaIds: z.array(z.number().int().positive()).min(1).max(100), activo: z.boolean() })
const fruitRoles = ["ADMIN", "SUBGERENTE", "JEFE_TURNO"]

export async function guardarPlantaAction(input: { id?: number; nombre: string; activo?: boolean }): Promise<ActionResult<Planta>> {
  return runAction(async () => {
    const data = plantSchema.parse(input)
    const user = await getCurrentUser()
    if (user.rol !== "ADMIN") throw new ForbiddenError()
    const repo = getRepositories().plantas
    const { id, nombre, activo } = data
    const plant = id === undefined ? await repo.crear({ nombre }) : await repo.actualizarCatalogo(id, { nombre, activo })
    revalidatePath("/administracion")
    revalidatePath("/configuracion")
    revalidatePath("/planificador")
    return plant
  })
}

export async function desactivarPlantaAction(id: number): Promise<ActionResult<null>> {
  return runAction(async () => {
    const plantId = z.number().int().positive().parse(id)
    if ((await getCurrentUser()).rol !== "ADMIN") throw new ForbiddenError()
    await getRepositories().plantas.desactivar(plantId)
    revalidatePath("/administracion")
    revalidatePath("/configuracion")
    revalidatePath("/planificador")
    return null
  })
}

export async function guardarFrutaAction(input: FrutaCatalogoInput & { id?: number }): Promise<ActionResult<Fruta>> {
  return runAction(async () => {
    const data = fruitSchema.parse(input)
    const user = await getCurrentUser()
    if (!fruitRoles.includes(user.rol)) throw new ForbiddenError()
    const repo = getRepositories().frutas
    const { id, ...values } = data
    const fruit = id === undefined ? await repo.crear(values) : await repo.actualizar(id, values)
    revalidatePath("/administracion")
    revalidatePath("/planificador")
    return fruit
  })
}

export async function desactivarFrutaAction(id: number): Promise<ActionResult<null>> {
  return runAction(async () => {
    const fruitId = z.number().int().positive().parse(id)
    if (!fruitRoles.includes((await getCurrentUser()).rol)) throw new ForbiddenError()
    await getRepositories().frutas.desactivar(fruitId)
    revalidatePath("/administracion")
    revalidatePath("/planificador")
    return null
  })
}
