import { addDays, parseIsoDate, toIsoDate } from "@/lib/dates"
import type {
  AlertaJornada,
  EstimacionJornada,
  MotivoAjuste,
  ParametrosPlanta,
  RegistroAvance,
} from "@/lib/domain"
import { formatDecimal, formatInt } from "@/lib/format"

/*
 * Réplica del cálculo de jornada del back (contexto §4 "En la jornada" y §6
 * REGISTRO_AVANCE), usada SOLO por los repositorios mock:
 * - Productividad real = jabas procesadas ÷ horas-persona hasta el último
 *   avance (antes del primero, rendimiento × eficiencia).
 * - Horas estimadas = horas transcurridas + pendiente ÷ (presentes × productividad).
 * - Esperado = meta × horas transcurridas ÷ horas del plan; el desvío de lo
 *   recibido contra lo esperado genera alerta si supera la tolerancia.
 */

/** Antes de esta cantidad de horas previas al inicio, la hora cuenta como del día siguiente. */
const MARGEN_PREVIO_H = 4

function horasDe(hhmm: string): number {
  const [h, m] = hhmm.split(":").map(Number)
  return h + m / 60
}

/** "2026-10-09" + "17:00" → "2026-10-09T17:00". */
export function fechaHora(fecha: string, hhmm: string): string {
  return `${fecha}T${hhmm.slice(0, 5)}`
}

/** Hora "HH:mm" de la jornada → fecha-hora; pasada la medianoche cuenta como el día siguiente. */
export function horaDeJornada(fecha: string, horaInicio: string, hhmm: string): string {
  const dia = horasDe(hhmm) < horasDe(horaInicio) - MARGEN_PREVIO_H
    ? toIsoDate(addDays(parseIsoDate(fecha), 1))
    : fecha
  return fechaHora(dia, hhmm)
}

/** Horas decimales entre dos fechas-hora locales. */
export function horasEntre(desde: string, hasta: string): number {
  return (Date.parse(`${hasta}:00Z`) - Date.parse(`${desde}:00Z`)) / 3_600_000
}

export interface ContextoJornada {
  /** Jabas meta del día. */
  meta: number
  /** Horas vigentes del día: las actualizadas o, si no hay, las del plan. */
  horasPlan: number
  trabajadoresPlan: number
  parametros: ParametrosPlanta
}

/** Omit que respeta cada variante de una unión. */
type OmitirEnUnion<T, K extends PropertyKey> = T extends unknown ? Omit<T, K> : never

/** Un registro sin los valores que calcula el back. */
export type Evento = OmitirEnUnion<
  RegistroAvance,
  "id" | "trabajadoresPresentes" | "horasEstimadas" | "alertas"
>

export function estimar(
  horaInicio: string,
  trabajadoresInicio: number,
  eventos: Evento[],
  ctx: ContextoJornada,
): EstimacionJornada {
  const ritmoPlan = ctx.parametros.rendimientoPersonaHora * ctx.parametros.factorEficiencia
  let trabajadores = trabajadoresInicio
  let volumen = ctx.meta
  let t = 0
  let horasPersona = 0
  let procesadas: number | null = null
  let horasPersonaAlAvance = 0
  let motivo: MotivoAjuste | null = null

  for (const e of eventos) {
    const te = horasEntre(horaInicio, e.hora)
    if (te > t) {
      horasPersona += trabajadores * (te - t)
      t = te
    }
    if (e.tipo === "PERSONAL") {
      trabajadores = Math.max(0, trabajadores + e.cambioPersonal)
      motivo = "PERSONAL_PRESENTE"
    } else if (e.tipo === "VOLUMEN") {
      volumen = e.jabasEsperadasDia
      motivo = "CAMBIO_VOLUMEN"
    } else {
      procesadas = e.jabasProcesadasAcum
      horasPersonaAlAvance = horasPersona
    }
  }

  const ritmoReal = procesadas !== null && horasPersonaAlAvance > 0
  const productividad = ritmoReal ? procesadas! / horasPersonaAlAvance : ritmoPlan
  // Lo procesado hasta ahora: el último avance más lo trabajado desde entonces.
  const procesadoEstimado =
    procesadas !== null
      ? procesadas + (horasPersona - horasPersonaAlAvance) * productividad
      : horasPersona * productividad
  const pendiente = Math.max(0, volumen - procesadoEstimado)
  const ritmoEquipo = Math.max(1, trabajadores) * productividad

  return {
    horasTranscurridas: t,
    trabajadoresPresentes: trabajadores,
    jabasProcesadas: procesadas ?? 0,
    volumenDia: volumen,
    productividad,
    ritmoReal,
    pendiente,
    horasEstimadas: t + pendiente / ritmoEquipo,
    motivoSugerido: motivo ?? "PERSONAL_PRESENTE",
  }
}

/** Alertas que dispara un registro, con el estimado calculado después de él. */
export function alertasDe(
  evento: Evento,
  horaInicio: string,
  est: EstimacionJornada,
  ctx: ContextoJornada,
): AlertaJornada[] {
  const alertas: AlertaJornada[] = []
  const tolerancia = ctx.parametros.toleranciaVolumen

  if (evento.tipo === "AVANCE") {
    const t = horasEntre(horaInicio, evento.hora)
    const esperado = ctx.meta * Math.min(1, t / ctx.horasPlan)
    const desvio = esperado > 0 ? evento.jabasRecibidasAcum / esperado - 1 : 0
    if (Math.abs(desvio) * 100 > tolerancia) {
      alertas.push({
        tipo: "VOLUMEN_ENTRANTE",
        mensaje:
          `Llegan ${formatInt(Math.abs(desvio) * 100)}% ${desvio > 0 ? "más" : "menos"} jabas de lo esperado ` +
          `(${formatInt(evento.jabasRecibidasAcum)} de ${formatInt(esperado)}).`,
      })
    }
  }

  if (evento.tipo === "VOLUMEN") {
    const desvio = evento.jabasEsperadasDia / ctx.meta - 1
    if (Math.abs(desvio) * 100 > tolerancia) {
      alertas.push({
        tipo: "VOLUMEN_ENTRANTE",
        mensaje:
          `El volumen del día cambia ${desvio > 0 ? "+" : "−"}${formatInt(Math.abs(desvio) * 100)}% ` +
          `respecto a la meta, más que la tolerancia de ${formatInt(tolerancia)}%.`,
      })
    }
  }

  if (est.horasEstimadas > ctx.horasPlan + 0.05 && est.trabajadoresPresentes < ctx.trabajadoresPlan) {
    alertas.push({
      tipo: "PERSONAL_INSUFICIENTE",
      mensaje:
        `Con ${formatInt(est.trabajadoresPresentes)} trabajadores (plan ${formatInt(ctx.trabajadoresPlan)}) ` +
        `el día termina en ${formatDecimal(est.horasEstimadas)} h, más que las ${formatDecimal(ctx.horasPlan)} h vigentes.`,
    })
  }

  return alertas
}
