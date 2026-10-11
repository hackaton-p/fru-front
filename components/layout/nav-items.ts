import type { Rol } from "@/lib/domain"

export interface NavItem {
  label: string
  href: string
  /** Roles que ven la opción en el menú. */
  roles: readonly Rol[]
}

const TODOS: readonly Rol[] = ["PLANIFICADOR", "SUBGERENTE", "JEFE_TURNO"]

/** Menú superior común (contexto §5). */
export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", roles: TODOS },
  { label: "Planificador", href: "/planificador", roles: ["PLANIFICADOR"] },
  { label: "Subgerente", href: "/subgerente", roles: ["SUBGERENTE"] },
  { label: "Jefe de turno", href: "/jefe-turno", roles: ["JEFE_TURNO"] },
  { label: "Configuración", href: "/configuracion", roles: TODOS },
]

/** Pantalla principal de cada rol. */
export const HOME_POR_ROL: Record<Rol, string> = {
  PLANIFICADOR: "/planificador",
  SUBGERENTE: "/subgerente/planes",
  JEFE_TURNO: "/jefe-turno",
}

export const ROL_LABEL: Record<Rol, string> = {
  PLANIFICADOR: "Planificador",
  SUBGERENTE: "Subgerente",
  JEFE_TURNO: "Jefe de turno",
}

export function navItemsFor(rol: Rol): NavItem[] {
  return NAV_ITEMS.filter((item) => item.roles.includes(rol))
}
