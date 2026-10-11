import type { EscenarioCosecha, EstadoPlan, ParametrosPlanta, Plan } from "@/lib/domain"
import { parametrosDistintos } from "@/lib/parametros"

/** Estados en los que el planificador todavía puede reemplazar el plan. */
const ESTADOS_EDITABLES: readonly EstadoPlan[] = ["BORRADOR", "RECHAZADO"]

export function planEditable(plan: Plan | null): boolean {
  return !plan || ESTADOS_EDITABLES.includes(plan.estado)
}

export interface SimulacionActual {
  escenario: EscenarioCosecha
  /** Valores finales de la simulación; null si hay campos inválidos. */
  parametros: ParametrosPlanta | null
}

/** ¿La simulación produce el mismo plan que el plan oficial guardado? */
export function coincideConPlan(simulacion: SimulacionActual, plan: Plan | null): boolean {
  if (!plan || !simulacion.parametros) return false
  return (
    plan.escenarioCosecha === simulacion.escenario &&
    parametrosDistintos(simulacion.parametros, plan.parametrosUsados).length === 0
  )
}

export type EstadoCambios = "SIN_PLAN" | "BLOQUEADO" | "IGUAL" | "CON_CAMBIOS"

export function estadoCambios(simulacion: SimulacionActual, plan: Plan | null): EstadoCambios {
  if (!plan) return "SIN_PLAN"
  if (!planEditable(plan)) return "BLOQUEADO"
  return coincideConPlan(simulacion, plan) ? "IGUAL" : "CON_CAMBIOS"
}
