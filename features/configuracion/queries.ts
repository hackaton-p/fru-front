import "server-only"
import { isoWeek } from "@/lib/dates"
import type { Planta, Usuario } from "@/lib/domain"
import { can } from "@/lib/auth/permissions"
import { getRepositories } from "@/lib/repositories"

const FRUTA_POR_DEFECTO = 1
const PLANTA_POR_DEFECTO = 1

/** Día con el que "Así calcula el sistema" muestra el efecto de los parámetros. */
export interface DiaEjemplo {
  fecha: string
  semana: number
  jabas: number
}

export interface ConfiguracionData {
  plantas: Planta[]
  /** Día pico de la próxima semana proyectada, por planta. null si no hay proyección. */
  ejemplos: Record<number, DiaEjemplo | null>
  plantaInicial: number
  puedeEditar: boolean
}

export async function getConfiguracionData(user: Usuario, hoy: Date): Promise<ConfiguracionData> {
  const repos = getRepositories()
  // Igual que el planificador: por defecto se planifica la semana siguiente.
  const semana = (isoWeek(hoy).week % 52) + 1
  const plantas = await repos.plantas.listar()
  const cosechas = await Promise.all(
    plantas.map((p) =>
      repos.proyecciones.getCosecha({
        plantaId: p.id,
        frutaId: FRUTA_POR_DEFECTO,
        anio: isoWeek(hoy).year,
        semana,
      }),
    ),
  )
  const ejemplos = Object.fromEntries(
    plantas.map((p, i) => {
      const pico = cosechas[i].reduce<(typeof cosechas)[number][number] | null>(
        (max, d) => (!max || d.jabas > max.jabas ? d : max),
        null,
      )
      return [p.id, pico ? { fecha: pico.fecha, semana, jabas: pico.jabas } : null]
    }),
  )
  const plantaInicial = plantas.some((p) => p.id === user.plantaId)
    ? user.plantaId!
    : (plantas[0]?.id ?? PLANTA_POR_DEFECTO)
  return { plantas, ejemplos, plantaInicial, puedeEditar: can(user.rol, "planta:editar") }
}
