import type { AreaCodigo } from "./plan"
import type { SemanaQuery } from "./proyeccion"

/** Trabajadores por área. */
export type PersonalPorArea = Record<AreaCodigo, number>

/**
 * Un día de la semana en curso: lo proyectado en el plan contra lo ejecutado
 * en la jornada (JORNADA + PLAN_DIA_AREA). Los valores de ejecución son null
 * mientras la jornada sigue abierta.
 */
export interface CursoDia {
  /** Fecha ISO (YYYY-MM-DD). */
  fecha: string
  jabasProyectadas: number
  jabasEjecutadas: number | null
  /** Horas trabajadas en la jornada. */
  horas: number | null
  /** kgLoose ÷ (kgLoose + kgFijo), como fracción. El % fijo es el complemento. */
  pesoLoose: number | null
  /** jabasDescarte ÷ jabasProcesadas, como fracción. */
  descarte: number | null
  personalProyectado: PersonalPorArea
  personalEjecutado: PersonalPorArea
  /** Personas que ingresaron ese día. */
  ingresos: number
  /** Ausentismo reportado por la planta, como fracción. */
  ausentismo: number
}

/** Curso de una semana en ejecución (proyectado vs ejecutado). */
export interface CursoSemana extends SemanaQuery {
  /** Origen de los datos, para mostrarlo en pantalla. */
  fuente: string
  dias: CursoDia[]
}
