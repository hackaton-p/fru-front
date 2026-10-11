import { z } from "zod"
import type { ParametroEditable, ParametrosPlanta } from "@/lib/domain"
import { formatDecimal, formatInt } from "@/lib/format"

/*
 * Parámetros del plan (contexto §2 y §3). La planta aporta valores por
 * defecto; el planificador parte de ellos, puede cambiarlos y el plan guarda
 * los valores finales. Los rangos replican las validaciones de PLANTA (§6).
 * Algunos valores tienen otra unidad en pantalla (eficiencia: 80 % = 0.8).
 */

export interface ParametroDef {
  key: ParametroEditable
  label: string
  /** Etiqueta corta para el resumen. */
  shortLabel: string
  step: number
  min: number
  max?: number
  integer?: boolean
  toDisplay: (value: number) => number
  fromDisplay: (value: number) => number
  format: (value: number) => string
}

const identity = (v: number) => v
const horas = (v: number) => `${formatDecimal(v, Number.isInteger(v) ? 0 : 1)} h`
const porcentaje = (v: number) => `${formatDecimal(v, Number.isInteger(v) ? 0 : 1)}%`

export const PARAMETROS: ParametroDef[] = [
  {
    key: "rendimientoPersonaHora",
    label: "Rendimiento (jabas por persona-hora)",
    shortLabel: "Rendimiento",
    step: 0.1,
    min: 0.1,
    toDisplay: identity,
    fromDisplay: identity,
    format: (v) => `${formatDecimal(v)} jabas/persona-h`,
  },
  {
    key: "horasJornada",
    label: "Horas por jornada",
    shortLabel: "Jornada",
    step: 0.5,
    min: 1,
    max: 24,
    toDisplay: identity,
    fromDisplay: identity,
    format: horas,
  },
  {
    key: "horasExtraMax",
    label: "Horas extra permitidas",
    shortLabel: "Horas extra máx.",
    step: 0.5,
    min: 0,
    max: 24,
    toDisplay: identity,
    fromDisplay: identity,
    format: horas,
  },
  {
    key: "factorEficiencia",
    label: "Eficiencia planificada (%)",
    shortLabel: "Eficiencia",
    step: 1,
    min: 10,
    max: 100,
    toDisplay: (v) => Math.round(v * 1000) / 10,
    fromDisplay: (v) => v / 100,
    format: (v) => porcentaje(Math.round(v * 1000) / 10),
  },
  {
    key: "personalMaximo",
    label: "Personal máximo disponible",
    shortLabel: "Personal máx.",
    step: 1,
    min: 1,
    integer: true,
    toDisplay: identity,
    fromDisplay: identity,
    format: (v) => formatInt(v),
  },
  {
    key: "toleranciaVolumen",
    label: "Tolerancia de volumen para alertas (%)",
    shortLabel: "Tolerancia",
    step: 1,
    min: 0,
    max: 100,
    toDisplay: identity,
    fromDisplay: identity,
    format: porcentaje,
  },
]

/** Valores de los inputs, en unidades de pantalla. */
export type ParametrosInput = Record<ParametroEditable, string>

export type ParametrosErrors = Partial<Record<ParametroEditable, string>>

export function toInput(parametros: ParametrosPlanta): ParametrosInput {
  return Object.fromEntries(
    PARAMETROS.map((d) => [d.key, String(d.toDisplay(parametros[d.key]))]),
  ) as ParametrosInput
}

function displaySchema(def: ParametroDef) {
  let schema = z.number({ error: "Ingresa un número" }).min(def.min, `Mínimo ${def.min}`)
  if (def.max !== undefined) schema = schema.max(def.max, `Máximo ${def.max}`)
  if (def.integer) schema = schema.int("Debe ser un número entero")
  return schema
}

/**
 * Convierte los inputs a parámetros de dominio. `values` es null mientras
 * algún campo sea inválido. `horaInicio` se toma de `base`.
 */
export function parseParametros(
  input: ParametrosInput,
  base: ParametrosPlanta,
): { values: ParametrosPlanta | null; errors: ParametrosErrors } {
  const values: ParametrosPlanta = { ...base }
  const errors: ParametrosErrors = {}
  for (const def of PARAMETROS) {
    const raw = input[def.key].trim()
    const parsed = displaySchema(def).safeParse(raw === "" ? Number.NaN : Number(raw))
    if (parsed.success) values[def.key] = def.fromDisplay(parsed.data)
    else errors[def.key] = raw === "" ? "Campo obligatorio" : parsed.error.issues[0]?.message
  }
  return { values: Object.keys(errors).length ? null : values, errors }
}

/** Esquema de dominio para validar los parámetros en el servidor. */
export const parametrosSchema = z.object({
  rendimientoPersonaHora: z.number().positive(),
  personalMaximo: z.number().int().min(1),
  horasJornada: z.number().min(1).max(24),
  horasExtraMax: z.number().min(0).max(24),
  horaInicio: z.string().regex(/^\d{2}:\d{2}(:\d{2})?$/),
  factorEficiencia: z.number().min(0.1).max(1),
  toleranciaVolumen: z.number().min(0).max(100),
})

const EPSILON = 1e-6

/** Parámetros cuyo valor difiere entre dos juegos de parámetros. */
export function parametrosDistintos(a: ParametrosPlanta, b: ParametrosPlanta): ParametroEditable[] {
  return PARAMETROS.filter((d) => Math.abs(a[d.key] - b[d.key]) > EPSILON).map((d) => d.key)
}

export function parametroDef(key: ParametroEditable): ParametroDef {
  return PARAMETROS.find((d) => d.key === key)!
}
