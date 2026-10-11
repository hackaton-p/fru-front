import "server-only"
import type { Fruta, Planta, Usuario } from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"

export interface AdministracionData {
  plantas: Planta[]
  frutas: Fruta[]
  puedeGestionarPlantas: boolean
}

export async function getAdministracionData(user: Usuario): Promise<AdministracionData> {
  const puedeGestionarFrutas = ["ADMIN", "SUBGERENTE", "JEFE_TURNO"].includes(user.rol)
  if (!puedeGestionarFrutas) throw new Error("No tienes permiso para administrar catálogos.")
  const repos = getRepositories()
  const [plantas, frutas] = await Promise.all([
    repos.plantas.listar({ includeInactive: user.rol === "ADMIN" }),
    repos.frutas.listar(undefined, true),
  ])
  return { plantas, frutas, puedeGestionarPlantas: user.rol === "ADMIN" }
}
