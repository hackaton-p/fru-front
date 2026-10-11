export interface BrechaComercial {
  hayBrecha: boolean
  /** Jabas que faltan para cubrir el programa comercial (0 si se cubre). */
  jabas: number
  /** Fracción del programa comercial que falta (0.038 = 3.8%). */
  porcentaje: number
}

/** Alerta de planificación: la cosecha no cubre el programa comercial. */
export function calcularBrecha(cosechaJabas: number, comercialJabas: number): BrechaComercial {
  const jabas = Math.max(0, comercialJabas - cosechaJabas)
  return {
    hayBrecha: jabas > 0,
    jabas,
    porcentaje: comercialJabas > 0 ? jabas / comercialJabas : 0,
  }
}
