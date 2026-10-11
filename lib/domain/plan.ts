import type { ParametrosPlanta } from "./planta"
import type { SemanaQuery } from "./proyeccion"

export const ESTADOS_PLAN = [
  "BORRADOR",
  "PENDIENTE",
  "APROBADO",
  "RECHAZADO",
  "EN_EJECUCION",
  "CERRADO",
] as const
export type EstadoPlan = (typeof ESTADOS_PLAN)[number]

export const ESTADOS_DIA = [
  "DENTRO_JORNADA",
  "HORAS_EXTRA",
  "RIESGO_TURNO_EXTRA",
  "MARGEN_BAJO",
] as const
export type EstadoDia = (typeof ESTADOS_DIA)[number]

export const ESCENARIOS_COSECHA = ["PROYECTADA", "+10", "+20", "-10"] as const
export type EscenarioCosecha = (typeof ESCENARIOS_COSECHA)[number]

export const AREAS = [
  "PACKING",
  "ALMACEN",
  "TRAZABILIDAD",
  "MANTENIMIENTO",
  "SANEAMIENTO",
] as const
export type AreaCodigo = (typeof AREAS)[number]

/** Por qué el jefe de turno ajustó las horas del día. */
export const MOTIVOS_AJUSTE = ["CAMBIO_VOLUMEN", "PERSONAL_PRESENTE"] as const
export type MotivoAjuste = (typeof MOTIVOS_AJUSTE)[number]

export interface PlanDiaArea {
  area: AreaCodigo
  trabajadoresPlan: number
}

/** Un día del plan con los valores calculados por el back (PLAN_DIA + derivados). */
export interface PlanDia {
  /** Fecha ISO (YYYY-MM-DD). */
  fecha: string
  jabasMeta: number
  trabajadores: number
  horas: number
  /** Fracción de volumen extra que cabe en jornada + horas extra (0.2 = +20%). */
  margen: number
  estadoDia: EstadoDia
  areas: PlanDiaArea[]
  /** Ajuste del jefe de turno durante la jornada; la meta nunca cambia. */
  horasActualizadas?: number | null
  motivoAjuste?: MotivoAjuste | null
}

export interface PlanTotales {
  jabasMeta: number
  trabajadoresPico: number
  trabajadoresPromedio: number
  horasTotal: number
  horasPromedio: number
  /** Meta ÷ programa comercial (1 = 100%). */
  cumplimientoComercial: number
}

/** Resultado de un cálculo de plan. Lo devuelve tanto la simulación como el plan guardado. */
export interface PlanCalculado {
  escenarioCosecha: EscenarioCosecha
  /** Valores finales con que se calculó; son los que valen para el plan. */
  parametrosUsados: ParametrosPlanta
  /** true si algún valor difiere del default de la planta (informativo). */
  parametrosModificados: boolean
  dias: PlanDia[]
  totales: PlanTotales
}

/** Plan oficial persistido. */
export interface Plan extends PlanCalculado {
  id: number
  plantaId: number
  frutaId: number
  anio: number
  semana: number
  estado: EstadoPlan
  updatedAt: string
  fechaEnvio?: string | null
  fechaAprobacion?: string | null
  comentarioAprobacion?: string | null
}

/** Body de `POST /planes/simular` y `POST /planes`. */
export interface CalcularPlanInput extends SemanaQuery {
  escenarioCosecha: EscenarioCosecha
  /** Valores finales de los parámetros (defaults de la planta, cambiados o no). */
  parametros: ParametrosPlanta
}
