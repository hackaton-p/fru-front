import type { Rol } from "@/lib/domain"

/** Acciones protegidas por rol (contexto §6 ROL). */
const PERMISOS = {
  "plan:gestionar": ["PLANIFICADOR"],
  "plan:aprobar": ["SUBGERENTE"],
  "planta:editar": ["PLANIFICADOR", "SUBGERENTE", "JEFE_TURNO"],
  "jornada:registrar": ["JEFE_TURNO"],
  "dashboard:ver": ["ADMIN", "PLANIFICADOR", "SUBGERENTE", "JEFE_TURNO"],
} as const satisfies Record<string, readonly Rol[]>

export type Permiso = keyof typeof PERMISOS

export function can(rol: Rol, permiso: Permiso): boolean {
  return (PERMISOS[permiso] as readonly Rol[]).includes(rol)
}
