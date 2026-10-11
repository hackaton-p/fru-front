import type { AreaCodigo, MotivoAjuste, Plan, PlanDia } from "./plan"

/*
 * Ejecución de un día del plan (contexto §6: JORNADA, PLAN_DIA_AREA,
 * REGISTRO_AVANCE y ALERTA). Las horas son decimales y las fechas-hora son
 * locales de planta, "YYYY-MM-DDTHH:mm" (la jornada cruza la medianoche).
 */

export type EstadoJornada = "ABIERTA" | "CERRADA"

export const TIPOS_REGISTRO = ["AVANCE", "PERSONAL", "VOLUMEN"] as const
export type TipoRegistro = (typeof TIPOS_REGISTRO)[number]

export type TipoAlertaJornada = "VOLUMEN_ENTRANTE" | "PERSONAL_INSUFICIENTE"

export interface AlertaJornada {
  tipo: TipoAlertaJornada
  /** Texto listo para mostrar, con los números. */
  mensaje: string
}

export interface JornadaArea {
  area: AreaCodigo
  trabajadoresPlan: number
  trabajadoresLlegaron: number
  /** Con cuántos arranca (no puede ser mayor que los que llegaron). */
  trabajadoresInicio: number
  /** Actual: cambia con los registros de personal. */
  trabajadoresPresentes: number
}

interface RegistroBase {
  id: number
  hora: string
  /** Total después del registro. */
  trabajadoresPresentes: number
  /** Estimado después del registro. */
  horasEstimadas: number
  alertas: AlertaJornada[]
}

export type RegistroAvance = RegistroBase &
  (
    | { tipo: "AVANCE"; jabasRecibidasAcum: number; jabasProcesadasAcum: number }
    | { tipo: "PERSONAL"; area: AreaCodigo; cambioPersonal: number }
    | { tipo: "VOLUMEN"; jabasEsperadasDia: number }
  )

/** Estimado vigente de la jornada (derivado, no se guarda). */
export interface EstimacionJornada {
  /** Horas desde el inicio hasta el último registro. */
  horasTranscurridas: number
  trabajadoresPresentes: number
  /** Del último avance (0 si aún no hay). */
  jabasProcesadas: number
  /** Jabas esperadas en el día (la meta, salvo cambio de volumen). */
  volumenDia: number
  /** Jabas por persona-hora: real desde el primer avance; antes, rendimiento × eficiencia. */
  productividad: number
  ritmoReal: boolean
  /** Jabas que faltan procesar al ritmo actual. */
  pendiente: number
  horasEstimadas: number
  /** Motivo a proponer si se ajustan las horas. */
  motivoSugerido: MotivoAjuste
}

export interface CierreJornada {
  horasTrabajadas: number
  jabasProcesadas: number
  jabasDescarte: number
  kgLoose: number
  kgFijo: number
  metaCumplida: boolean
  /** jabasProcesadas − meta; negativa si quedó fruta pendiente. */
  diferencia: number
}

export interface Jornada {
  id: number
  planId: number
  /** Fecha del PLAN_DIA (YYYY-MM-DD). */
  fecha: string
  estado: EstadoJornada
  horaInicio: string
  horasEstimadasInicio: number
  areas: JornadaArea[]
  registros: RegistroAvance[]
  estimacion: EstimacionJornada
  cierre: CierreJornada | null
}

/** El día que le toca ejecutar al jefe de turno, con su jornada si ya empezó. */
export interface JornadaDelDia {
  plan: Plan
  dia: PlanDia
  jornada: Jornada | null
}

export interface IniciarJornadaInput {
  planId: number
  fecha: string
  areas: { area: AreaCodigo; llegaron: number; inician: number }[]
}

/** `hora` es "HH:mm" del día de la jornada. */
export type RegistroInput = { hora: string } & (
  | { tipo: "AVANCE"; jabasRecibidasAcum: number; jabasProcesadasAcum: number }
  | { tipo: "PERSONAL"; area: AreaCodigo; cambioPersonal: number }
  | { tipo: "VOLUMEN"; jabasEsperadasDia: number }
)

export interface AjusteHorasInput {
  horasActualizadas: number
  motivoAjuste: MotivoAjuste
}

export interface CerrarJornadaInput {
  horasTrabajadas: number
  jabasProcesadas: number
  jabasDescarte: number
  kgLoose: number
  kgFijo: number
}
