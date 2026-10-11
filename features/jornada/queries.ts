import "server-only"
import { serverEnv } from "@/lib/config/env"
import type { JornadaDelDia, Planta, Usuario } from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"

const PLANTA_POR_DEFECTO = 1

export interface JornadaData {
  planta: Planta
  /** null si la planta no tiene un plan aprobado o en ejecución. */
  actual: JornadaDelDia | null
  /** Datos de ejemplo (API_MOCK): habilita "Reiniciar jornada (demo)". */
  demo: boolean
}

export async function getJornadaData(user: Usuario): Promise<JornadaData> {
  const repos = getRepositories()
  const plantaId = user.plantaId ?? PLANTA_POR_DEFECTO
  const [planta, actual] = await Promise.all([
    repos.plantas.getById(plantaId),
    repos.jornadas.getActual(plantaId),
  ])
  return { planta, actual, demo: serverEnv().API_MOCK }
}
