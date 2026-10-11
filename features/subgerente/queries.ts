import "server-only"
import { cache } from "react"
import { notFound } from "next/navigation"
import { z } from "zod"
import { ApiError } from "@/lib/api/errors"
import { isoWeek } from "@/lib/dates"
import type { CursoSemana, Fruta, Plan, Planta, SemanaQuery, Usuario } from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"
import { ESTADOS_SUBGERENTE } from "./lib/estados"

const FRUTA_POR_DEFECTO = 1

/** Planes enviados que el usuario puede ver (todas las plantas si no tiene una asignada). */
const listarPlanesVisibles = cache(async (plantaId: number | null): Promise<Plan[]> => {
  const planes = await getRepositories().planes.listar(plantaId ? { plantaId } : {})
  return planes.filter((p) => ESTADOS_SUBGERENTE.includes(p.estado))
})

const listarPlantasVisibles = cache(async (plantaId: number | null): Promise<Planta[]> => {
  const plantas = await getRepositories().plantas.listar()
  return plantaId ? plantas.filter((p) => p.id === plantaId) : plantas
})

export async function contarPendientes(user: Usuario): Promise<number> {
  const planes = await listarPlanesVisibles(user.plantaId)
  return planes.filter((p) => p.estado === "PENDIENTE").length
}

export interface PlanesData {
  planes: Plan[]
  plantas: Planta[]
}

export async function getPlanesData(user: Usuario): Promise<PlanesData> {
  const [planes, plantas] = await Promise.all([
    listarPlanesVisibles(user.plantaId),
    listarPlantasVisibles(user.plantaId),
  ])
  return { planes, plantas }
}

export interface PlanDetalleData {
  plan: Plan
  planta: Planta
  fruta: Fruta
}

export async function getPlanDetalleData(id: number, user: Usuario): Promise<PlanDetalleData> {
  const repos = getRepositories()
  let plan: Plan
  try {
    plan = await repos.planes.getById(id)
  } catch (error) {
    if (error instanceof ApiError && error.status === 404) notFound()
    throw error
  }
  const visible =
    ESTADOS_SUBGERENTE.includes(plan.estado) &&
    (user.plantaId === null || user.plantaId === plan.plantaId)
  if (!visible) notFound()

  const [planta, fruta] = await Promise.all([
    repos.plantas.getById(plan.plantaId),
    repos.frutas.getById(plan.frutaId),
  ])
  return { plan, planta, fruta }
}

const cursoParamsSchema = z.object({
  planta: z.coerce.number().int().positive().optional().catch(undefined),
  semana: z.coerce.number().int().min(1).max(53).optional().catch(undefined),
})

export interface CursoData {
  query: SemanaQuery
  plantas: Planta[]
  planta: Planta
  curso: CursoSemana | null
  /** Planes por aprobar de todas las plantas visibles. */
  pendientes: Plan[]
}

/**
 * Curso de la semana. Por defecto muestra la semana en ejecución de la planta
 * (o la semana actual si no hay ninguna).
 */
export async function getCursoData(
  searchParams: Record<string, string | string[] | undefined>,
  user: Usuario,
  hoy: Date,
): Promise<CursoData> {
  const sp = cursoParamsSchema.parse(searchParams)
  const [plantas, planes] = await Promise.all([
    listarPlantasVisibles(user.plantaId),
    listarPlanesVisibles(user.plantaId),
  ])
  const planta = plantas.find((p) => p.id === (user.plantaId ?? sp.planta)) ?? plantas[0]
  if (!planta) notFound()

  const enEjecucion = planes.find((p) => p.plantaId === planta.id && p.estado === "EN_EJECUCION")
  const query: SemanaQuery = {
    plantaId: planta.id,
    frutaId: enEjecucion?.frutaId ?? FRUTA_POR_DEFECTO,
    anio: enEjecucion?.anio ?? isoWeek(hoy).year,
    semana: sp.semana ?? enEjecucion?.semana ?? isoWeek(hoy).week,
  }
  const curso = await getRepositories().curso.getSemana(query)

  return {
    query,
    plantas,
    planta,
    curso,
    pendientes: planes.filter((p) => p.estado === "PENDIENTE"),
  }
}
