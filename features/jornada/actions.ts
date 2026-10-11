"use server"

import { revalidatePath } from "next/cache"
import { z } from "zod"
import { ForbiddenError, runAction, type ActionResult } from "@/lib/action-result"
import { can } from "@/lib/auth/permissions"
import { getCurrentUser } from "@/lib/auth/session"
import { serverEnv } from "@/lib/config/env"
import {
  AREAS,
  MOTIVOS_AJUSTE,
  type AjusteHorasInput,
  type CerrarJornadaInput,
  type IniciarJornadaInput,
  type Jornada,
  type RegistroInput,
} from "@/lib/domain"
import { getRepositories } from "@/lib/repositories"

const idSchema = z.number().int().positive()
const entero = (campo: string) =>
  z.number({ error: `Ingresa ${campo}.` }).int(`${campo} debe ser un número entero.`).min(0, `${campo} no puede ser negativo.`)
const horaSchema = z.string().regex(/^\d{2}:\d{2}$/, "Ingresa la hora en formato HH:mm.")

const iniciarSchema = z.object({
  planId: idSchema,
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  areas: z
    .array(z.object({ area: z.enum(AREAS), llegaron: entero("Llegaron"), inician: entero("Inician") }))
    .min(1),
})

const registroSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("AVANCE"),
    hora: horaSchema,
    jabasRecibidasAcum: entero("Jabas recibidas"),
    jabasProcesadasAcum: entero("Jabas procesadas"),
  }),
  z.object({
    tipo: z.literal("PERSONAL"),
    hora: horaSchema,
    area: z.enum(AREAS),
    cambioPersonal: z
      .number({ error: "Indica cuántas personas llegan o salen." })
      .int("La cantidad debe ser un número entero.")
      .refine((n) => n !== 0, "Indica cuántas personas llegan o salen."),
  }),
  z.object({
    tipo: z.literal("VOLUMEN"),
    hora: horaSchema,
    jabasEsperadasDia: z
      .number({ error: "Indica las jabas esperadas del día." })
      .positive("Indica las jabas esperadas del día."),
  }),
])

const ajusteSchema = z.object({
  horasActualizadas: z.number().positive().max(24),
  motivoAjuste: z.enum(MOTIVOS_AJUSTE),
})

const cierreSchema = z
  .object({
    horasTrabajadas: z
      .number({ error: "Ingresa las horas trabajadas." })
      .positive("Ingresa las horas trabajadas.")
      .max(24),
    jabasProcesadas: entero("Jabas procesadas"),
    jabasDescarte: entero("Jabas de descarte"),
    kgLoose: z.number({ error: "Ingresa los kg loose." }).min(0, "Los kg no pueden ser negativos."),
    kgFijo: z.number({ error: "Ingresa los kg fijo." }).min(0, "Los kg no pueden ser negativos."),
  })
  .refine((d) => d.jabasDescarte <= d.jabasProcesadas, {
    message: "El descarte no puede superar las jabas procesadas.",
    path: ["jabasDescarte"],
  })

async function assertPuedeRegistrar() {
  const user = await getCurrentUser()
  if (!can(user.rol, "jornada:registrar")) throw new ForbiddenError()
  return user
}

/** La jornada cambia la pantalla del jefe de turno y el curso del subgerente. */
function revalidar() {
  revalidatePath("/jefe-turno")
  revalidatePath("/subgerente", "layout")
}

export async function iniciarJornadaAction(input: IniciarJornadaInput): Promise<ActionResult<Jornada>> {
  return runAction(async () => {
    const data = iniciarSchema.parse(input)
    const user = await assertPuedeRegistrar()
    const repos = getRepositories()
    const plan = await repos.planes.getById(data.planId)
    if (user.plantaId !== null && user.plantaId !== plan.plantaId) {
      throw new ForbiddenError("No puedes iniciar jornadas de otra planta.")
    }
    const jornada = await repos.jornadas.iniciar(data)
    revalidar()
    return jornada
  })
}

export async function registrarEnJornadaAction(
  jornadaId: number,
  input: RegistroInput,
): Promise<ActionResult<Jornada>> {
  return runAction(async () => {
    const id = idSchema.parse(jornadaId)
    const data = registroSchema.parse(input)
    await assertPuedeRegistrar()
    const jornada = await getRepositories().jornadas.registrar(id, data)
    revalidar()
    return jornada
  })
}

export async function ajustarHorasAction(
  jornadaId: number,
  input: AjusteHorasInput,
): Promise<ActionResult<Jornada>> {
  return runAction(async () => {
    const id = idSchema.parse(jornadaId)
    const data = ajusteSchema.parse(input)
    await assertPuedeRegistrar()
    const jornada = await getRepositories().jornadas.ajustarHoras(id, data)
    revalidar()
    return jornada
  })
}

export async function cerrarJornadaAction(
  jornadaId: number,
  input: CerrarJornadaInput,
): Promise<ActionResult<Jornada>> {
  return runAction(async () => {
    const id = idSchema.parse(jornadaId)
    const data = cierreSchema.parse(input)
    await assertPuedeRegistrar()
    const jornada = await getRepositories().jornadas.cerrar(id, data)
    revalidar()
    return jornada
  })
}

/** Solo con datos de ejemplo: borra la última jornada para repetir la demo. */
export async function reiniciarJornadaDemoAction(): Promise<ActionResult<null>> {
  return runAction(async () => {
    const user = await assertPuedeRegistrar()
    if (!serverEnv().API_MOCK) throw new ForbiddenError("Solo disponible con datos de ejemplo.")
    const { reiniciarJornadaDemo } = await import("@/lib/repositories/mock")
    await reiniciarJornadaDemo(user.plantaId ?? 1)
    revalidar()
    return null
  })
}
