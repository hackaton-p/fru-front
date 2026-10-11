import "server-only"
import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { apiRequest } from "@/lib/api/http-client"
import { ApiError } from "@/lib/api/errors"
import { serverEnv } from "@/lib/config/env"
import type { Rol, Usuario } from "@/lib/domain"

/** Cookie donde el selector "Ver como" guarda el rol de la demo. */
export const DEMO_ROL_COOKIE = "demo_rol"

/** Un usuario de ejemplo por rol, mientras API_MOCK esté activo. */
const USUARIOS_DEMO: Record<Rol, Usuario> = {
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
}

/** Memoizado por request: varias partes del árbol (header, página) piden el usuario actual. */
const getUsuarioReal = cache(async (): Promise<Usuario> => {
  const token = (await cookies()).get(serverEnv().AUTH_COOKIE_NAME)?.value
  if (!token) redirect("/login")
  try {
    const actor = await apiRequest<ActorResponse>("/users/me")
    return { id: actor.id, nombre: actor.name, rol: actor.role, plantaId: actor.plantId }
  } catch (error) {
    if (error instanceof ApiError && error.isUnauthorized) redirect("/login")
    throw error
  }
})

/**
 * Usuario de la sesión actual. Con `API_MOCK=true` usa el rol elegido en "Ver como"
 * (planificador de Piura por defecto); contra el API real exige sesión y redirige a
 * `/login` si falta o venció.
 */
export async function getCurrentUser(): Promise<Usuario> {
  if (serverEnv().API_MOCK) {
    const rol = (await cookies()).get(DEMO_ROL_COOKIE)?.value
    return USUARIOS_DEMO[isRol(rol) ? rol : "PLANIFICADOR"]
  }
  return getUsuarioReal()
}
