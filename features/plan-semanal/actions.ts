"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ForbiddenError, runAction, type ActionResult } from "@/lib/action-result"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import {
  ESCENARIOS_COSECHA,
  type CalcularPlanInput,
  type ImportarProyeccionResultado,
  type Plan,
  type PlanCalculado,
} from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"
import { parametrosSchema } from "@/lib/parametros"

const RUTA = "/planificador"
const MAX_EXCEL_BYTES = 10 * 1024 * 1024

const semanaSchema = z.object({
  plantaId: z.number().int().positive(),
  frutaId: z.number().int().positive(),
  anio: z.number().int().min(2000).max(2100),
  semana: z.number().int().min(1).max(53),
})

const calcularSchema = semanaSchema.extend({
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
      archivo: formData.get("archivo"),
    })
    await assertPuedeGestionar(data.plantaId)
    const resultado = await getRepositories().proyecciones.importar(data)
    revalidatePath(RUTA)
    return resultado
  })
}
