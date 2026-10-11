import { parseIsoDate } from "./dates"

/*
 * Formateo de cifras para pantalla. Se usa separador de miles "," y decimal
 * "." como en los reportes de planta (11,180 · 9.8 h).
 */

const LOCALE = "en-US"
const DIAS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"]
const DIAS_LARGOS = ["domingo", "lunes", "martes", "miércoles", "jueves", "viernes", "sábado"]

const enteros = new Intl.NumberFormat(LOCALE, { maximumFractionDigits: 0 })

export function formatInt(value: number): string {
  return enteros.format(Math.round(value))
}

export function formatDecimal(value: number, digits = 1): string {
  return value.toLocaleString(LOCALE, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  })
}

export function formatHoras(value: number): string {
  return `${formatDecimal(value)} h`
}

/** 0.044 → "4.4%". */
export function formatPercent(fraction: number, digits = 1): string {
  return `${formatDecimal(fraction * 100, digits)}%`
}

/** 0.2 → "+20%". Los negativos se muestran como "+0%" (sin margen). */
export function formatMargen(fraction: number): string {
  return `+${formatInt(Math.max(0, fraction * 100))}%`
}

function ddmm(date: Date) {
  const dd = String(date.getUTCDate()).padStart(2, "0")
  const mm = String(date.getUTCMonth() + 1).padStart(2, "0")
  return `${dd}/${mm}`
}

/** "2026-10-12" → "12/10". */
export function formatFechaCorta(iso: string): string {
  return ddmm(parseIsoDate(iso))
}

/** Primera y última fecha ISO → "12/10 al 16/10". */
export function formatRangoFechas(fechas: string[]): string {
  if (fechas.length === 0) return ""
  const orden = [...fechas].sort()
  return `${formatFechaCorta(orden[0])} al ${formatFechaCorta(orden[orden.length - 1])}`
}

/** "2026-10-12" → "Lun 12/10". */
export function formatDia(iso: string): string {
  const date = parseIsoDate(iso)
  return `${DIAS[date.getUTCDay()]} ${ddmm(date)}`
}

/** "2026-10-12" → "lunes 12/10". */
export function formatDiaLargo(iso: string): string {
  const date = parseIsoDate(iso)
  return `${DIAS_LARGOS[date.getUTCDay()]} ${ddmm(date)}`
}

/** ISO datetime → "hoy 14:32" o "12/10 14:32" (hora local). */
export function formatMomento(isoDateTime: string, now = new Date()): string {
  const date = new Date(isoDateTime)
  const hhmm = `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`
  const mismoDia = date.toDateString() === now.toDateString()
  const dd = String(date.getDate()).padStart(2, "0")
  const mm = String(date.getMonth() + 1).padStart(2, "0")
  return mismoDia ? `hoy ${hhmm}` : `${dd}/${mm} ${hhmm}`
}

export function capitalize(text: string): string {
  return text.charAt(0).toUpperCase() + text.slice(1)
}
