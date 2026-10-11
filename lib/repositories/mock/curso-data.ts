import { addDays, mondayOfIsoWeek, toIsoDate } from "@/lib/dates"
import type { AreaCodigo, CursoSemana, PersonalPorArea, SemanaQuery } from "@/lib/domain"

/*
 * Curso de la semana 41 de Piura, del "REPORTE SANTA MARIA _PIURA SEM 41".
 * El viernes la jornada sigue abierta: hay personal, pero aún no hay jabas,
 * horas, peso ni descarte. Sullana no tiene datos reales de ejecución.
 */

const AREAS: AreaCodigo[] = ["PACKING", "ALMACEN", "TRAZABILIDAD", "MANTENIMIENTO", "SANEAMIENTO"]

/** Filas por área (en el orden de AREAS) → un registro por día. */
function porDia(filas: number[][]): PersonalPorArea[] {
  return filas[0].map(
    (_, dia) =>
      Object.fromEntries(AREAS.map((area, i) => [area, filas[i][dia]])) as PersonalPorArea,
  )
}

const PIURA_41 = {
  fuente: "reporte Santa María / Piura sem 41",
  jabasProyectadas: [12_000, 10_000, 12_000, 13_000, 13_000],
  jabasEjecutadas: [10_490, 10_178, 11_234, 12_527, null],
  horas: [8.33, 9.08, 9.45, 11.75, null],
  pesoLoose: [0.513, 0.616, 0.682, 0.628, null],
  descarte: [0.079, 0.091, 0.097, 0.106, null],
  personalProyectado: porDia([
    [239, 210, 239, 247, 247],
    [11, 9, 11, 11, 11],
    [7, 9, 7, 7, 7],
    [6, 6, 6, 6, 6],
    [14, 13, 14, 13, 13],
  ]),
  personalEjecutado: porDia([
    [176, 159, 159, 157, 153],
    [6, 7, 7, 7, 7],
    [8, 8, 8, 8, 8],
    [6, 5, 5, 6, 5],
    [13, 13, 13, 13, 13],
  ]),
  ingresos: [21, 0, 0, 0, 0],
  ausentismo: [0, 0.081, 0, 0.005, 0.031],
}

export function cursoMock(query: SemanaQuery, hoy = new Date()): CursoSemana | null {
  if (query.plantaId !== 1 || query.semana !== 41) return null
  const lunes = mondayOfIsoWeek(hoy.getUTCFullYear(), query.semana)
  const d = PIURA_41
  return {
    ...query,
    fuente: d.fuente,
    dias: d.jabasProyectadas.map((jabasProyectadas, i) => ({
      fecha: toIsoDate(addDays(lunes, i)),
      jabasProyectadas,
      jabasEjecutadas: d.jabasEjecutadas[i],
      horas: d.horas[i],
      pesoLoose: d.pesoLoose[i],
      descarte: d.descarte[i],
      personalProyectado: d.personalProyectado[i],
      personalEjecutado: d.personalEjecutado[i],
      ingresos: d.ingresos[i],
      ausentismo: d.ausentismo[i],
    })),
  }
}
