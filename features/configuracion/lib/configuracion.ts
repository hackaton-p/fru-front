import type { EstadoDia, ParametroEditable, ParametrosPlanta } from "@/lib/domain"
import {
  parametroDef,
  parametrosDistintos,
  parseParametros,
  toInput,
  type ParametrosErrors,
  type ParametrosInput,
} from "@/lib/parametros"

/*
 * Formulario de "Configuración de planta": los mismos parámetros del plan
 * (lib/parametros) más la hora de inicio, que solo se cambia aquí.
 */

export type CampoConfig = ParametroEditable | "horaInicio"

export interface CampoDef {
  key: CampoConfig
  label: string
  unidad: string
  ayuda: string
}

export interface GrupoDef {
  titulo: string
  descripcion: string
  campos: CampoDef[]
}

export const GRUPOS: GrupoDef[] = [
  {
    titulo: "Personal y rendimiento",
    descripcion: "Con esto el sistema calcula cuántos trabajadores necesita cada día.",
    campos: [
      {
        key: "rendimientoPersonaHora",
        label: "Rendimiento por persona",
        unidad: "jabas / h",
        ayuda: "Jabas que procesa en promedio una persona en una hora, contando a todo el personal.",
      },
      {
        key: "personalMaximo",
        label: "Personal máximo disponible",
        unidad: "personas",
        ayuda: "Tope de trabajadores; si se necesitan más, el plan sube las horas.",
      },
    ],
  },
  {
    titulo: "Jornada",
    descripcion:
      "Un solo turno por día. Pasar de la jornada más las horas extra es riesgo de turno extra.",
    campos: [
      {
        key: "horasJornada",
        label: "Horas por jornada",
        unidad: "horas",
        ayuda: "Duración normal del turno de packing.",
      },
      {
        key: "horasExtraMax",
        label: "Horas extra permitidas",
        unidad: "horas",
        ayuda: "Máximo que se puede extender el turno el mismo día.",
      },
      {
        key: "horaInicio",
        label: "Hora de inicio",
        unidad: "",
        ayuda: "Se usa para estimar la hora de fin durante la jornada.",
      },
    ],
  },
  {
    titulo: "Eficiencia y tolerancias",
    descripcion: "El margen que deja el plan para absorber imprevistos y cuándo avisar.",
    campos: [
      {
        key: "factorEficiencia",
        label: "Eficiencia planificada",
        unidad: "%",
        ayuda: "El plan asume este porcentaje del rendimiento; lo que sobra es margen.",
      },
      {
        key: "toleranciaVolumen",
        label: "Tolerancia de volumen entrante",
        unidad: "%",
        ayuda: "Desvío de jabas frente a lo esperado que no genera alerta.",
      },
    ],
  },
]

export type ConfigInput = ParametrosInput & { horaInicio: string }
export type ConfigErrors = ParametrosErrors & { horaInicio?: string }

const HORA = /^([01]\d|2[0-3]):[0-5]\d$/

/** "17:00:00" → "17:00", para el input type="time". */
function horaCorta(hora: string) {
  return hora.slice(0, 5)
}

export function toConfigInput(p: ParametrosPlanta): ConfigInput {
  return { ...toInput(p), horaInicio: horaCorta(p.horaInicio) }
}

/** Valores de dominio; `values` es null mientras algún campo sea inválido. */
export function parseConfig(
  input: ConfigInput,
  base: ParametrosPlanta,
): { values: ParametrosPlanta | null; errors: ConfigErrors } {
  const { values, errors } = parseParametros(input, base)
  const todos: ConfigErrors = { ...errors }
  const hora = input.horaInicio.trim()
  if (!hora) todos.horaInicio = "Campo obligatorio"
  else if (!HORA.test(hora)) todos.horaInicio = "Usa el formato HH:mm"
  if (!values || todos.horaInicio) return { values: null, errors: todos }
  return { values: { ...values, horaInicio: hora }, errors: todos }
}

/**
 * Campos distintos de lo guardado. Un campo inválido cuenta como cambio si su
 * texto difiere del guardado (no se puede comparar el número).
 */
export function camposCambiados(input: ConfigInput, guardado: ParametrosPlanta): CampoConfig[] {
  const base = toConfigInput(guardado)
  const { values } = parseConfig(input, guardado)
  const keys = Object.keys(base) as CampoConfig[]
  if (!values) return keys.filter((k) => input[k].trim() !== base[k])
  const cambiados: CampoConfig[] = parametrosDistintos(values, guardado)
  if (horaCorta(values.horaInicio) !== base.horaInicio) cambiados.push("horaInicio")
  return keys.filter((k) => cambiados.includes(k))
}

/** Valor guardado, para mostrarlo en modo lectura o junto a un campo cambiado. */
export function formatCampo(key: CampoConfig, p: ParametrosPlanta): string {
  if (key === "horaInicio") return horaCorta(p.horaInicio)
  return parametroDef(key).format(p[key])
}

export interface EjemploCalculo {
  jabas: number
  /** Jabas que procesa una persona en la jornada normal, con la eficiencia aplicada. */
  jabasPorPersona: number
  /** Trabajadores que pide el volumen, antes del tope. */
  requeridos: number
  /** Trabajadores que propone el plan (con el tope de personal máximo). */
  trabajadores: number
  horas: number
  /** Fruta adicional que entra en la jornada más las horas extra (0.2 = +20%). */
  margen: number
  /** El volumen pide más personal del disponible. */
  topeAlcanzado: boolean
  estadoDia: EstadoDia
}

/**
 * Cálculo de un día (contexto §4), el mismo que hace el back al simular:
 * trabajadores = jabas ÷ (rendimiento × eficiencia × horas de jornada).
 */
export function calcularEjemplo(jabas: number, p: ParametrosPlanta): EjemploCalculo {
  const ritmoPersona = p.rendimientoPersonaHora * p.factorEficiencia
  const requeridos = Math.ceil(jabas / (ritmoPersona * p.horasJornada))
  const trabajadores = Math.max(1, Math.min(requeridos, Math.round(p.personalMaximo)))
  const horas = jabas / (trabajadores * ritmoPersona)
  const margen = (trabajadores * ritmoPersona * (p.horasJornada + p.horasExtraMax)) / jabas - 1
  let estadoDia: EstadoDia = "DENTRO_JORNADA"
  if (horas > p.horasJornada + p.horasExtraMax) estadoDia = "RIESGO_TURNO_EXTRA"
  else if (horas > p.horasJornada) estadoDia = "HORAS_EXTRA"
  else if (margen * 100 < p.toleranciaVolumen) estadoDia = "MARGEN_BAJO"
  return {
    jabas,
    jabasPorPersona: ritmoPersona * p.horasJornada,
    requeridos,
    trabajadores,
    horas,
    margen,
    topeAlcanzado: requeridos > p.personalMaximo,
    estadoDia,
  }
}
