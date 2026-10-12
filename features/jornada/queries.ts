import "server-only"
import { serverEnv } from "@/lib/config/env"
import type { JornadaDelDia, PlanEnEjecucion, Planta, Usuario } from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"

const PLANTA_POR_DEFECTO = 1

export interface JornadaData {
  planta: Planta
  /** null si la planta no tiene un plan aprobado o en ejecución. */
  actual: JornadaDelDia | null
  /** Planes aprobados, en ejecución y cerrados de la planta, con el avance por día. */
  planes: PlanEnEjecucion[]
  /** Datos de ejemplo (API_MOCK): habilita "Reiniciar jornada (demo)". */
  demo: boolean
}

export async function getJornadaData(user: Usuario): Promise<JornadaData> {
  const repos = getRepositories()
  const plantaId = user.plantaId ?? PLANTA_POR_DEFECTO
  const [planta, actual, planes] = await Promise.all([
    repos.plantas.getById(plantaId),
    repos.jornadas.getActual(plantaId),
    repos.jornadas.listarPlanes(plantaId),
  ])
  return { planta, actual, planes, demo: serverEnv().API_MOCK }
}
