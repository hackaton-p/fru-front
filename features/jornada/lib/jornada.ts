import type { EstimacionJornada, Jornada, ParametrosPlanta, PlanDia } from "@/lib/domain"

/*
 * Cálculos de pantalla del jefe de turno (contexto §4 "En la jornada"). El
 * estimado durante la jornada lo calcula el back; aquí solo se replica la
 * fórmula del inicio para mostrarla en vivo mientras se escribe.
 */

export type EstadoHoras = "EN_PLAN" | "HORAS_EXTRA" | "RIESGO_TURNO_EXTRA"

/** Tolerancia de redondeo al comparar horas (3 minutos). */
const TOLERANCIA_H = 0.05

/** Jabas por persona-hora que asume el plan. */
export function ritmoPlan(p: ParametrosPlanta): number {
  return p.rendimientoPersonaHora * p.factorEficiencia
}

/** Horas que toma la meta con N trabajadores al ritmo del plan (Infinity si N = 0). */
export function horasConTrabajadores(meta: number, trabajadores: number, p: ParametrosPlanta): number {
  return trabajadores > 0 ? meta / (trabajadores * ritmoPlan(p)) : Number.POSITIVE_INFINITY
}

/** Trabajadores necesarios para terminar la meta en `horas`. */
export function trabajadoresParaHoras(meta: number, horas: number, p: ParametrosPlanta): number {
  return Math.ceil(meta / (ritmoPlan(p) * horas))
}

/** Dentro de las horas vigentes, con horas extra o con riesgo de un segundo turno. */
export function clasificarHoras(horas: number, vigentes: number, p: ParametrosPlanta): EstadoHoras {
  if (horas <= vigentes + TOLERANCIA_H) return "EN_PLAN"
  if (horas <= p.horasJornada + p.horasExtraMax) return "HORAS_EXTRA"
  return "RIESGO_TURNO_EXTRA"
}

/** "17:00" + 10.6 h → "03:36". */
export function horaFin(horaInicio: string, horas: number): string {
  const [h, m] = horaInicio.slice(0, 5).split(":").map(Number)
  const total = h * 60 + m + Math.round(horas * 60)
  const hh = Math.floor(total / 60) % 24
  const mm = total % 60
  return `${String(hh).padStart(2, "0")}:${String(mm).padStart(2, "0")}`
}

/** "2026-10-09T19:00" → "19:00". */
export function horaDe(fechaHora: string): string {
  return fechaHora.slice(11, 16)
}

/**
 * Personas adicionales para terminar lo pendiente dentro de `horasObjetivo`
 * al ritmo actual; null si ya no hay tiempo para lograrlo.
 */
export function personasAdicionales(est: EstimacionJornada, horasObjetivo: number): number | null {
  const restantes = horasObjetivo - est.horasTranscurridas
  if (restantes <= 0) return null
  const necesarias = Math.ceil(est.pendiente / (restantes * est.productividad))
  return Math.max(0, necesarias - est.trabajadoresPresentes)
}

/** Horas vigentes del día: las actualizadas por el jefe de turno o las del plan. */
export function horasVigentes(dia: PlanDia): number {
  return dia.horasActualizadas ?? dia.horas
}

export function totalInicio(jornada: Jornada): number {
  return jornada.areas.reduce((s, a) => s + a.trabajadoresInicio, 0)
}

export function totalLlegaron(jornada: Jornada): number {
  return jornada.areas.reduce((s, a) => s + a.trabajadoresLlegaron, 0)
}

/** Hora sugerida para el siguiente registro: una hora después del último (o 2 h tras el inicio). */
export function horaSugerida(jornada: Jornada): string {
  const ultimo = jornada.registros.at(-1)
  return ultimo ? horaFin(horaDe(ultimo.hora), 1) : horaFin(horaDe(jornada.horaInicio), 2)
}
