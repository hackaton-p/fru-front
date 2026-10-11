import "server-only"
import { z } from "zod"
import { addDays, isoWeek, mondayOfIsoWeek } from "@/lib/dates"
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
  anio: z.coerce.number().int().min(2000).max(2100).optional().catch(undefined),
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
  const semanaSiguiente = isoWeek(addDays(mondayOfIsoWeek(isoWeek(hoy).year, isoWeek(hoy).week), 7))
  return {
    plantaId: user.plantaId ?? sp.planta ?? PLANTA_POR_DEFECTO,
    frutaId: sp.fruta ?? FRUTA_POR_DEFECTO,
    anio: sp.anio ?? semanaSiguiente.year,
    semana: sp.semana ?? semanaSiguiente.week,
  }
}

export interface PlanSemanalData {
  query: SemanaQuery
  planta: Planta
  fruta: Fruta
  cosecha: ProyeccionCosechaDia[]
  comercial: ProyeccionComercialCliente[]
  plan: Plan | null
  /** Fallos de lectura recuperables; permiten seguir cargando los pasos disponibles. */
  erroresCarga: string[]
  simulacionInicial: {
    escenario: EscenarioCosecha
    /** Defaults de la planta, o los valores finales del plan si ya existe. */
    parametros: ParametrosPlanta
    resultado: PlanCalculado
  }
}

export async function getPlanSemanalData(query: SemanaQuery): Promise<PlanSemanalData> {
  const repos = getRepositories()
  const erroresCarga: string[] = []
  const [plantaResult, frutaResult, cosechaResult, comercialResult, planResult] = await Promise.allSettled([
    repos.plantas.getById(query.plantaId),
    repos.frutas.getById(query.frutaId),
    repos.proyecciones.getCosecha(query),
    repos.proyecciones.getComercial(query),
    repos.planes.getVigente(query),
  ])

  const registrarError = (result: PromiseRejectedResult, recurso: string) => {
    const detalle = result.reason instanceof Error ? result.reason.message : "Error desconocido"
    erroresCarga.push(`${recurso}: ${detalle}`)
  }

  // Conserva la pantalla y deja completar la configuración aunque el API falle al
  // leer la planta. Nunca se considera configurada una planta de respaldo.
  const planta: Planta = plantaResult.status === "fulfilled"
    ? plantaResult.value
    : {
        id: query.plantaId,
        nombre: `Planta ${query.plantaId}`,
        rendimientoPersonaHora: 5.9,
        personalMaximo: 300,
        horasJornada: 10,
        horasExtraMax: 2,
        horaInicio: "17:00",
        factorEficiencia: 0.8,
        toleranciaVolumen: 5,
        configuradaAt: null,
      }
  if (plantaResult.status === "rejected") registrarError(plantaResult, "No se pudo leer la planta")

  const fruta: Fruta = frutaResult.status === "fulfilled"
    ? frutaResult.value
    : { id: query.frutaId, nombre: `Fruta ${query.frutaId}` }
  if (frutaResult.status === "rejected") registrarError(frutaResult, "No se pudo leer la fruta")

  const cosecha = cosechaResult.status === "fulfilled" ? cosechaResult.value : []
  if (cosechaResult.status === "rejected") registrarError(cosechaResult, "No se pudo leer la proyección de cosecha")
  const comercial = comercialResult.status === "fulfilled" ? comercialResult.value : []
  if (comercialResult.status === "rejected") registrarError(comercialResult, "No se pudo leer el programa comercial")
  const plan = planResult.status === "fulfilled" ? planResult.value : null
  if (planResult.status === "rejected") registrarError(planResult, "No se pudo comprobar si ya existe un plan")

  // Si ya hay plan oficial, la simulación arranca con sus mismos valores.
  // Sin las dos proyecciones no se pide una simulación al back: el usuario
  // debe poder cargar primero las bases de la semana.
  const defaults = parametrosDe(planta)
  const resultadoVacio: PlanCalculado = {
    escenarioCosecha: "PROYECTADA",
    parametrosUsados: defaults,
    parametrosModificados: false,
    dias: [],
    totales: {
      jabasMeta: 0,
      trabajadoresPico: 0,
      trabajadoresPromedio: 0,
      horasTotal: 0,
      horasPromedio: 0,
      cumplimientoComercial: 0,
    },
  }
  let simulacionInicial: PlanSemanalData["simulacionInicial"]
  if (plan) {
    simulacionInicial = {
      escenario: plan.escenarioCosecha,
      parametros: plan.parametrosUsados,
      resultado: plan,
    }
  } else {
    simulacionInicial = { escenario: "PROYECTADA", parametros: defaults, resultado: resultadoVacio }
    if (planta.configuradaAt && cosecha.length > 0 && comercial.length > 0) {
      try {
        simulacionInicial.resultado = await repos.planes.simular({
          ...query,
          escenarioCosecha: "PROYECTADA",
          parametros: defaults,
        })
      } catch (error) {
        const detalle = error instanceof Error ? error.message : "Error desconocido"
        erroresCarga.push(`No se pudo calcular la simulación inicial: ${detalle}`)
      }
    }
  }

  return { query, planta, fruta, cosecha, comercial, plan, erroresCarga, simulacionInicial }
}
