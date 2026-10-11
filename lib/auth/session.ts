import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { apiRequest } from "@/lib/api/http-client"
import { ApiError } from "@/lib/api/errors"
import { serverEnv } from "@/lib/config/env"
import type { Rol, Usuario } from "@/lib/domain"

/** Cookie de sesión local cuando el front corre con datos mock. */
export const DEMO_ROL_COOKIE = "demo_rol"
export const ACTIVE_PLANT_COOKIE = "active_plant"

/** Un usuario de ejemplo por rol, mientras API_MOCK esté activo. */
const USUARIOS_DEMO: Record<Rol, Usuario> = {
  ADMIN: { id: 0, nombre: "Administrador", rol: "ADMIN", plantaId: null },
  PLANIFICADOR: { id: 1, nombre: "Planificador", rol: "PLANIFICADOR", plantaId: 1 },
  SUBGERENTE: { id: 2, nombre: "Subgerente", rol: "SUBGERENTE", plantaId: null },
  JEFE_TURNO: { id: 3, nombre: "Jefe de turno", rol: "JEFE_TURNO", plantaId: 1 },
}

export function isRol(value: unknown): value is Rol {
  return typeof value === "string" && value in USUARIOS_DEMO
}

interface ActorResponse {
  id: number
  authUserId: string
  name: string
  email: string
  role: Rol
  plantId: number | null
  plantIds?: number[]
}

/** Memoizado por request: varias partes del árbol (header, página) piden el usuario actual. */
const getUsuarioReal = cache(async (): Promise<Usuario> => {
  const token = (await cookies()).get(serverEnv().AUTH_COOKIE_NAME)?.value
  if (!token) redirect("/login")
  try {
    const actor = await apiRequest<ActorResponse>("/users/me")
    return { id: actor.id, nombre: actor.name, rol: actor.role, plantaId: actor.plantId, plantaIds: actor.plantIds }
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login")
    throw error
  }
})

/**
 * Usuario de la sesión actual. Tanto con datos mock como con el API real, exige
 * que el usuario haya pasado por el formulario de login.
 */
export async function getCurrentUser(): Promise<Usuario> {
  let user: Usuario
  if (serverEnv().API_MOCK) {
    const rol = (await cookies()).get(DEMO_ROL_COOKIE)?.value
    if (!isRol(rol)) redirect("/login")
    user = USUARIOS_DEMO[rol]
  } else {
    user = await getUsuarioReal()
  }
  const selectedPlant = Number((await cookies()).get(ACTIVE_PLANT_COOKIE)?.value)
  const allowedPlantIds = user.plantaIds ?? (user.plantaId === null ? undefined : [user.plantaId])
  if (Number.isInteger(selectedPlant) && selectedPlant > 0 && (allowedPlantIds === undefined || allowedPlantIds.includes(selectedPlant))) {
    return { ...user, plantaId: selectedPlant }
  }
  return user
}
