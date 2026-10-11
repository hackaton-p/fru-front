import { addDays, mondayOfIsoWeek, toIsoDate } from "@/lib/dates"
import { parametrosDe, type EstadoPlan, type ParametrosPlanta, type Plan } from "@/lib/domain"
import { PLANTAS } from "./data"
import { calcularPlan } from "./plan-calculator"

/*
 * Planes de ejemplo de "Plan de Packing · Pantallas" (pantalla Subgerente):
 * semanas 40 y 41 de ambas plantas y la 42 de Sullana. La semana 42 de Piura
 * no se siembra: la crea el planificador desde su pantalla.
 */

interface Semilla {
  id: number
  plantaId: number
  semana: number
  /** Jabas por día, de lunes a viernes. */
  jabas: number[]
  /** Total del programa comercial de la semana. */
  comercial: number
  estado: EstadoPlan
  /** Valores que el planificador cambió respecto al default de la planta. */
  cambios?: Partial<ParametrosPlanta>
}

const SEMILLAS: Semilla[] = [
  {
    id: 1,
    plantaId: 2,
    semana: 42,
    jabas: [40_000, 41_000, 42_000, 43_000, 42_000],
    comercial: 200_000,
    estado: "PENDIENTE",
    cambios: { factorEficiencia: 0.85 },
  },
  {
    id: 2,
    plantaId: 1,
    semana: 41,
    jabas: [12_000, 10_000, 12_000, 13_000, 13_000],
    comercial: 58_000,
    estado: "EN_EJECUCION",
    cambios: { personalMaximo: 290 },
  },
  {
    id: 3,
    plantaId: 2,
    semana: 41,
    jabas: [36_000, 37_300, 40_500, 40_000, 42_100],
    comercial: 190_000,
    estado: "EN_EJECUCION",
  },
  {
    id: 4,
    plantaId: 1,
    semana: 40,
    jabas: [11_000, 11_500, 12_000, 12_000, 11_000],
    comercial: 57_000,
    estado: "CERRADO",
  },
  {
    id: 5,
    plantaId: 2,
    semana: 40,
    jabas: [35_000, 36_000, 38_000, 39_000, 38_000],
    comercial: 180_000,
    estado: "CERRADO",
  },
]

/** El último ID usado por las semillas; los planes nuevos siguen desde aquí. */
export const ULTIMO_ID_SEMILLA = Math.max(...SEMILLAS.map((s) => s.id))

/** Mediodía en Perú (UTC−5) del día indicado. */
function mediodia(date: Date) {
  return new Date(toIsoDate(date) + "T17:00:00.000Z").toISOString()
}

export function planesSemilla(hoy = new Date()): Plan[] {
  const year = hoy.getUTCFullYear()
  return SEMILLAS.map((s) => {
    const planta = PLANTAS.find((p) => p.id === s.plantaId)!
    const lunes = mondayOfIsoWeek(year, s.semana)
    const parametros = { ...parametrosDe(planta), ...s.cambios }
    const calculado = calcularPlan({
      cosecha: s.jabas.map((jabas, i) => ({ frutaId: 1, fruta: "Uva", fecha: toIsoDate(addDays(lunes, i)), jabas })),
      totalComercial: s.comercial,
      comercialPorFruta: [{ frutaId: 1, jabas: s.comercial }],
      parametros,
      parametrosModificados: s.cambios !== undefined,
      escenarioCosecha: "PROYECTADA",
    })

    // Pendiente: enviado hace un rato. El resto: enviado el jueves y aprobado
    // el viernes previos a la semana.
    const pendiente = s.estado === "PENDIENTE"
    const fechaEnvio = pendiente
      ? new Date(hoy.getTime() - 45 * 60_000).toISOString()
      : mediodia(addDays(lunes, -4))
    const fechaAprobacion = pendiente ? null : mediodia(addDays(lunes, -3))

    return {
      ...calculado,
      id: s.id,
      plantaId: s.plantaId,
      frutaId: 1,
      anio: year,
      semana: s.semana,
      estado: s.estado,
      updatedAt: fechaAprobacion ?? fechaEnvio,
      fechaEnvio,
      fechaAprobacion,
      comentarioAprobacion: null,
    }
  })
}
