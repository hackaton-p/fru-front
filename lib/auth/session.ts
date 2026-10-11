import "server-only"
import { cookies } from "next/headers"
import type { Rol, Usuario } from "@/lib/domain"

/** Cookie donde el selector "Ver como" guarda el rol de la demo. */
export const DEMO_ROL_COOKIE = "demo_rol"

/** Un usuario de ejemplo por rol, mientras no exista el login. */
const USUARIOS_DEMO: Record<Rol, Usuario> = {
  PLANIFICADOR: { id: 1, nombre: "Planificador", rol: "PLANIFICADOR", plantaId: 1 },
  SUBGERENTE: { id: 2, nombre: "Subgerente", rol: "SUBGERENTE", plantaId: null },
  JEFE_TURNO: { id: 3, nombre: "Jefe de turno", rol: "JEFE_TURNO", plantaId: 1 },
}

export function isRol(value: unknown): value is Rol {
  return typeof value === "string" && value in USUARIOS_DEMO
}

/**
 * Usuario de la sesión actual.
 * TODO(auth): decodificar el JWT de la cookie (userId, rol, plantaId) cuando
 * exista el login del back. Mientras tanto usa el rol elegido en "Ver como"
 * (planificador de Piura por defecto).
 */
export async function getCurrentUser(): Promise<Usuario> {
  const rol = (await cookies()).get(DEMO_ROL_COOKIE)?.value
  return USUARIOS_DEMO[isRol(rol) ? rol : "PLANIFICADOR"]
}
