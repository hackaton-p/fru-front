import type { Rol } from "@/lib/domain"

export interface NavItem {
  label: string
  href: string
  /** Roles que ven la opción en el menú. */
  roles: readonly Rol[]
}

const TODOS: readonly Rol[] = ["ADMIN", "PLANIFICADOR", "SUBGERENTE", "JEFE_TURNO"]

/** Menú superior común (contexto §5). */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: TODOS },
  { label: "Planificador", href: "/planificador", roles: ["PLANIFICADOR"] },
  { label: "Planes", href: "/subgerente", roles: ["SUBGERENTE"] },
  { label: "Jornada", href: "/jefe-turno", roles: ["JEFE_TURNO"] },
  { label: "Configuración", href: "/configuracion", roles: TODOS },
  { label: "Administración", href: "/administracion", roles: ["ADMIN", "SUBGERENTE", "JEFE_TURNO"] },
]

/** Pantalla principal de cada rol. */
export const HOME_POR_ROL: Record<Rol, string> = {
  ADMIN: "/dashboard",
  PLANIFICADOR: "/dashboard",
  SUBGERENTE: "/dashboard",
  JEFE_TURNO: "/dashboard",
}

export const ROL_LABEL: Record<Rol, string> = {
  ADMIN: "Administrador",
  PLANIFICADOR: "Planificador",
  SUBGERENTE: "Subgerente",
  JEFE_TURNO: "Jefe de turno",
}

export function navItemsFor(rol: Rol): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(rol))
}
