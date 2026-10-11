/**
 * Parámetros de cálculo (contexto §3). En PLANTA son valores por defecto; en un
 * plan son los valores finales que usó (`parametrosUsados`).
 */
export interface ParametrosPlanta {
  /** Jabas que procesa una persona en una hora, contando a todo el personal. */
  rendimientoPersonaHora: number
  /** Tope de trabajadores. */
  personalMaximo: number
  /** Duración normal del turno, en horas decimales. */
  horasJornada: number
  /** Máximo que se puede extender el turno el mismo día. */
  horasExtraMax: number
  /** Hora de inicio del turno, "HH:mm". */
  horaInicio: string
  /** Fracción del rendimiento que asume el plan (0.1 – 1). En pantalla se muestra en %. */
  factorEficiencia: number
  /** Desvío de volumen entrante que no genera alerta, en % (0 – 100). */
  toleranciaVolumen: number
}

export interface Planta extends ParametrosPlanta {
  id: number
  nombre: string
}

/** Parámetros que el planificador puede cambiar en su plan. */
export type ParametroEditable = Exclude<keyof ParametrosPlanta, "horaInicio">

/** Valores por defecto de cálculo de una planta. */
export function parametrosDe(planta: Planta): ParametrosPlanta {
  return {
    rendimientoPersonaHora: planta.rendimientoPersonaHora,
    personalMaximo: planta.personalMaximo,
    horasJornada: planta.horasJornada,
    horasExtraMax: planta.horasExtraMax,
    horaInicio: planta.horaInicio,
    factorEficiencia: planta.factorEficiencia,
    toleranciaVolumen: planta.toleranciaVolumen,
  }
}
