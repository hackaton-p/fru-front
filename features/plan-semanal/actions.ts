"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ForbiddenError, runAction, type ActionResult } from "@/lib/action-result"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import {
  parametrosDe,
  ESCENARIOS_COSECHA,
  type CalcularPlanInput,
  type ImportarProyeccionResultado,
  type Plan,
  type PlanCalculado,
  type GuardarProyeccionInput,
} from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"
import { parametrosSchema } from "@/lib/parametros"
import { nextPlanningMonday, planningDates } from "@/lib/dates"
import { planEditable } from "./lib/plan-comparator"

const RUTA = "/planificador"
const MAX_EXCEL_BYTES = 10 * 1024 * 1024

const semanaSchema = z.object({
  inicio: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  cantidadDias: z.number().int().min(1).max(7).optional(),
  fechas: z.array(z.string().regex(/^\d{4}-\d{2}-\d{2}$/)).min(1).max(7).optional(),
  plantaId: z.number().int().positive(),
  frutaId: z.number().int().positive(),
  anio: z.number().int().min(2000).max(2100),
  semana: z.number().int().min(1).max(53),
})

const calcularSchema = semanaSchema.extend({
  planId: z.number().int().positive().optional(),
  escenarioCosecha: z.enum(ESCENARIOS_COSECHA),
  parametros: parametrosSchema,
})

/** El usuario debe poder gestionar planes y, si tiene planta asignada, solo la suya. */
async function assertPuedeGestionar(plantaId?: number) {
  const user = await getCurrentUser()
  if (!can(user.rol, "plan:gestionar")) throw new ForbiddenError()
  if (plantaId !== undefined && user.plantaId !== null && user.plantaId !== plantaId) {
    throw new ForbiddenError("No puedes planificar otra planta.")
  }
}

/** Recalcula un plan en edición (mismos parámetros y período) con las proyecciones ya guardadas. */
async function regenerarPlan(planId: number) {
  const repos = getRepositories()
  const plan = await repos.planes.getById(planId)
  await assertPuedeGestionar(plan.plantaId)
  if (!planEditable(plan)) throw new ForbiddenError("El plan ya fue enviado y no se puede modificar.")
  await repos.planes.aplicar({
    planId,
    plantaId: plan.plantaId,
    frutaId: plan.frutaId ?? 1,
    anio: plan.anio,
    semana: plan.semana,
    inicio: plan.dias[0]?.fecha,
    cantidadDias: plan.dias.length,
    fechas: plan.dias.map(day => day.fecha).sort(),
    escenarioCosecha: plan.escenarioCosecha,
    parametros: plan.parametrosUsados,
  })
}

/** Calcula un plan sin guardarlo (Paso 1 · Simulación). */
export async function simularPlanAction(
  input: CalcularPlanInput,
): Promise<ActionResult<PlanCalculado>> {
  return runAction(async () => {
    const data = calcularSchema.parse(input)
    await assertPuedeGestionar(data.plantaId)
    return getRepositories().planes.simular(data)
  })
}

/** Guarda la simulación como plan oficial (Paso 2). */
export async function aplicarPlanAction(input: CalcularPlanInput): Promise<ActionResult<Plan>> {
  return runAction(async () => {
    const data = calcularSchema.parse(input)
    await assertPuedeGestionar(data.plantaId)
    const plan = await getRepositories().planes.aplicar(data)
    revalidatePath(RUTA)
    return plan
  })
}

/** BORRADOR → PENDIENTE. */
export async function enviarPlanAction(planId: number): Promise<ActionResult<Plan>> {
  return runAction(async () => {
    const id = z.number().int().positive().parse(planId)
    await assertPuedeGestionar()
    const plan = await getRepositories().planes.enviar(id)
    revalidatePath(RUTA)
    return plan
  })
}

const importarSchema = semanaSchema.extend({
  planId: z.number().int().positive().optional(),
  tipo: z.enum(["COSECHA", "COMERCIAL"]),
  archivo: z
    .instanceof(File, { message: "Selecciona un archivo Excel." })
    .refine((f) => f.size > 0, "Selecciona un archivo Excel.")
    .refine((f) => f.size <= MAX_EXCEL_BYTES, "El archivo supera los 10 MB.")
    .refine((f) => /\.(xlsx|xls)$/i.test(f.name), "El archivo debe ser .xlsx o .xls."),
})

export type ImportarState = ActionResult<ImportarProyeccionResultado> | null

/** Carga la proyección de cosecha o el programa comercial desde Excel. */
export async function importarProyeccionAction(
  _prev: ImportarState,
  formData: FormData,
): Promise<ImportarState> {
  return runAction(async () => {
    const data = importarSchema.parse({
      tipo: formData.get("tipo"),
      plantaId: Number(formData.get("plantaId")),
      frutaId: Number(formData.get("frutaId")),
      anio: Number(formData.get("anio")),
      semana: Number(formData.get("semana")),
      inicio: formData.get("inicio") || undefined,
      fechas: formData.get("fechas") ? String(formData.get("fechas")).split(",") : undefined,
      planId: formData.get("planId") ? Number(formData.get("planId")) : undefined,
      archivo: formData.get("archivo"),
    })
    await assertPuedeGestionar(data.plantaId)
    const resultado = await getRepositories().proyecciones.importar(data)
    if (data.planId) await regenerarPlan(data.planId)
    revalidatePath(RUTA)
    return { ...resultado, planActualizado: Boolean(data.planId) }
  })
}

export async function guardarProyeccionAction(input: GuardarProyeccionInput): Promise<ActionResult<ImportarProyeccionResultado>> {
  return runAction(async () => {
    const schema = semanaSchema.extend({
      planId: z.number().int().positive().optional(),
      tipo: z.enum(["COSECHA", "COMERCIAL"]),
      registros: z.array(z.object({
        fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
        cliente: z.string().trim().min(1).max(255).optional(),
        pais: z.string().trim().min(2).max(100).optional(),
        frutaId: z.number().int().positive().optional(),
        jabas: z.number().min(0).max(1e9),
      })).min(1).max(500),
    }).refine(data => data.tipo !== "COSECHA" || data.registros.every(row => Number.isInteger(row.jabas)), {
      message: "La proyección de cosecha solo acepta jabas enteras, sin decimales.",
      path: ["registros"],
    })
    const data = schema.parse(input)
    await assertPuedeGestionar(data.plantaId)
    if (data.registros.some(r => data.tipo === "COSECHA" ? !r.fecha : !r.cliente || !r.pais || !r.frutaId)) {
      throw new Error("Completa los registros de la proyección.")
    }
    const repos = getRepositories()
    const result = data.tipo === "COMERCIAL"
      ? await (async () => {
          const porFruta = data.registros.reduce((groups, row) => {
            const rows = groups.get(row.frutaId!) ?? []
            rows.push(row)
            groups.set(row.frutaId!, rows)
            return groups
          }, new Map<number, typeof data.registros>())
          let registros = 0
          for (const [frutaId, rows] of porFruta) {
            const saved = await repos.proyecciones.guardar({ ...data, frutaId, registros: rows })
            registros += saved.registros
          }
          return { registros }
        })()
      : await repos.proyecciones.guardar(data)
    if (data.planId) await regenerarPlan(data.planId)
    revalidatePath(RUTA)
    return { ...result, planActualizado: Boolean(data.planId) }
  })
}

export async function crearPlanOficialAction(query: import("@/lib/domain").SemanaQuery, planId?: number): Promise<ActionResult<Plan>> {
  return runAction(async () => {
    const data = semanaSchema.parse(query)
    await assertPuedeGestionar(data.plantaId)
    const repos = getRepositories()
    const planta = await repos.plantas.getById(data.plantaId)
    if (!planta.configuradaAt) throw new ForbiddenError("Confirma la configuración de la planta antes de crear el plan.")
    const id = planId === undefined ? undefined : z.number().int().positive().parse(planId)
    if (id === undefined && planningDates(data)[0] < nextPlanningMonday(new Date())) throw new ForbiddenError("Solo puedes crear planificaciones para la próxima semana en adelante.")
    const plan = await repos.planes.aplicar({ ...data, planId: id, escenarioCosecha: "PROYECTADA", parametros: parametrosSchema.parse(parametrosDe(planta)) })
    revalidatePath(RUTA)
    return plan
  })
}

export async function descartarPlanAction(planId: number): Promise<ActionResult<void>> {
  return runAction(async () => {
    const id = z.number().int().positive().parse(planId)
    const repos = getRepositories()
    const plan = await repos.planes.getById(id)
    await assertPuedeGestionar(plan.plantaId)
    await repos.planes.descartar(id)
    revalidatePath(RUTA)
    revalidatePath("/subgerente/planes")
  })
}
