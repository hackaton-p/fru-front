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
    titulo: "Personal",
    descripcion: "Con esto el sistema calcula cuántos trabajadores necesita cada día.",
    campos: [
      {
        key: "rendimientoPersonaHora",
        label: "Rendimiento por persona",
        unidad: "jabas / h",
        ayuda: "Cuántas jabas procesa una persona en una hora, en promedio. Por ejemplo: 6 significa 6 jabas por persona cada hora. Se cuenta a todo el personal, no solo a packing.",
      },
      {
        key: "personalMaximo",
        label: "Personal máximo",
        unidad: "personas",
        ayuda: "La mayor cantidad de personas que puede trabajar ese día, sumando todas las áreas. Si no alcanzan, el sistema calcula más horas de trabajo.",
      },
    ],
  },
  {
    titulo: "Horario",
    descripcion:
      "Un solo turno por día. Pasar de la jornada más las horas extra es riesgo de turno extra.",
    campos: [
      {
        key: "horasJornada",
        label: "Duración del turno",
        unidad: "horas",
        ayuda: "Cuántas horas dura un turno normal, sin horas extra. Por ejemplo: 8 significa 8 horas. Para media hora, usa 0.5: 8.5 son 8 horas y 30 minutos.",
      },
      {
        key: "horasExtraMax",
        label: "Horas extra máximas",
        unidad: "horas",
        ayuda: "Cuántas horas más puede durar el turno. Por ejemplo: un turno de 8 horas con 2 horas extra puede llegar a 10 horas. Si el plan necesita más, muestra riesgo de turno extra.",
      },
      {
        key: "horaInicio",
        label: "Hora de inicio",
        unidad: "",
        ayuda: "La hora a la que normalmente empieza el turno. El sistema la usa para estimar cuándo terminará. Por ejemplo: 17:00 son las 5 de la tarde.",
      },
    ],
  },
  {
    titulo: "Eficiencia y alertas",
    descripcion: "El margen que deja el plan para absorber imprevistos y cuándo avisar.",
    campos: [
      {
        key: "factorEficiencia",
        label: "Eficiencia planificada",
        unidad: "%",
        ayuda: "Qué parte del rendimiento se usa para planificar. Con 80%, el sistema cuenta con 8 de cada 10 jabas de capacidad y deja espacio para pausas e imprevistos.",
      },
      {
        key: "toleranciaVolumen",
        label: "Variación de fruta sin alerta",
        unidad: "%",
        ayuda: "Cuánto puede variar la fruta recibida antes de avisar. Con 5%, si esperabas 100 jabas, una diferencia de hasta 5 jabas no genera alerta de volumen.",
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
