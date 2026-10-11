import "server-only"
import { z } from "zod"
import { isoWeek } from "@/lib/dates"
import {
  parametrosDe,
  type EscenarioCosecha,
  type Fruta,
  type ParametrosPlanta,
  type Plan,
  type PlanCalculado,
  type Planta,
  type ProyeccionCosechaDia,
  type ProyeccionComercialCliente,
  type SemanaQuery,
  type Usuario,
} from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"

const FRUTA_POR_DEFECTO = 1
const PLANTA_POR_DEFECTO = 1

const searchParamsSchema = z.object({
  planta: z.coerce.number().int().positive().optional().catch(undefined),
  fruta: z.coerce.number().int().positive().optional().catch(undefined),
  semana: z.coerce.number().int().min(1).max(53).optional().catch(undefined),
})

/**
 * Resuelve planta, fruta y semana desde la URL. Por defecto se planifica la
 * semana siguiente. Un usuario con planta asignada solo ve la suya.
 */
export function resolverSemanaQuery(
  searchParams: Record<string, string | string[] | undefined>,
  user: Usuario,
  hoy: Date,
): SemanaQuery {
  const sp = searchParamsSchema.parse(searchParams)
  return {
    plantaId: user.plantaId ?? sp.planta ?? PLANTA_POR_DEFECTO,
    frutaId: sp.fruta ?? FRUTA_POR_DEFECTO,
    semana: sp.semana ?? (isoWeek(hoy).week % 52) + 1,
  }
}

export interface PlanSemanalData {
  query: SemanaQuery
  planta: Planta
  fruta: Fruta
  cosecha: ProyeccionCosechaDia[]
  comercial: ProyeccionComercialCliente[]
  plan: Plan | null
  simulacionInicial: {
    escenario: EscenarioCosecha
    /** Defaults de la planta, o los valores finales del plan si ya existe. */
    parametros: ParametrosPlanta
    resultado: PlanCalculado
  }
}

export async function getPlanSemanalData(query: SemanaQuery): Promise<PlanSemanalData> {
  const repos = getRepositories()
  const [planta, fruta, cosecha, comercial, plan] = await Promise.all([
    repos.plantas.getById(query.plantaId),
    repos.frutas.getById(query.frutaId),
    repos.proyecciones.getCosecha(query),
    repos.proyecciones.getComercial(query),
    repos.planes.getVigente(query),
  ])

  // Si ya hay plan oficial, la simulación arranca con sus mismos valores;
  // si no, con los valores por defecto de la planta.
  const defaults = parametrosDe(planta)
  const simulacionInicial = plan
    ? { escenario: plan.escenarioCosecha, parametros: plan.parametrosUsados, resultado: plan }
    : {
        escenario: "PROYECTADA" as const,
        parametros: defaults,
        resultado: await repos.planes.simular({
          ...query,
          escenarioCosecha: "PROYECTADA",
          parametros: defaults,
        }),
      }

  return { query, planta, fruta, cosecha, comercial, plan, simulacionInicial }
}
