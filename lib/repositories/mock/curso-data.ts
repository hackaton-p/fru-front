import { addDays, mondayOfIsoWeek, toIsoDate } from "@/lib/dates"
import type {
  AreaCodigo,
  CursoDia,
  CursoSemana,
  Jornada,
  PersonalPorArea,
  SemanaQuery,
} from "@/lib/domain"

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

/**
 * Un día tomado entero de una jornada cerrada en la app: el plan que ejecutó
 * el jefe de turno y lo que pasó, sin mezclar con el reporte.
 */
function desdeJornada(dia: CursoDia, jornada: Jornada): CursoDia {
  const c = jornada.cierre!
  const kg = c.kgLoose + c.kgFijo
  const porArea = (campo: "trabajadoresPlan" | "trabajadoresPresentes") =>
    Object.fromEntries(jornada.areas.map((a) => [a.area, a[campo]])) as PersonalPorArea
  const plan = jornada.areas.reduce((s, a) => s + a.trabajadoresPlan, 0)
  const llegaron = jornada.areas.reduce((s, a) => s + a.trabajadoresLlegaron, 0)
  return {
    ...dia,
    jabasEjecutadas: c.jabasProcesadas,
    horas: c.horasTrabajadas,
    pesoLoose: kg > 0 ? c.kgLoose / kg : 0,
    descarte: c.jabasProcesadas > 0 ? c.jabasDescarte / c.jabasProcesadas : 0,
    personalProyectado: porArea("trabajadoresPlan"),
    personalEjecutado: porArea("trabajadoresPresentes"),
    // Personas que llegaron durante la jornada (registros de personal positivos).
    ingresos: jornada.registros.reduce(
      (s, r) => s + (r.tipo === "PERSONAL" && r.cambioPersonal > 0 ? r.cambioPersonal : 0),
      0,
    ),
    // Quienes no llegaron, como el reporte de planta (los que llegaron y no
    // iniciaron, o salieron después, ya se ven en el personal ejecutado).
    ausentismo: plan > 0 ? Math.max(0, 1 - llegaron / plan) : 0,
  }
}

/**
 * Curso de Piura sem 41. `jornadaCerrada` devuelve la jornada cerrada de un
 * día, si la hay: sus cifras reemplazan las del reporte (el viernes en curso).
 */
export function cursoMock(
  query: SemanaQuery,
  hoy = new Date(),
  jornadaCerrada?: (fecha: string) => Jornada | undefined,
): CursoSemana | null {
  if (query.plantaId !== 1 || query.semana !== 41) return null
  const lunes = mondayOfIsoWeek(hoy.getUTCFullYear(), query.semana)
  const d = PIURA_41
  return {
    ...query,
    fuente: d.fuente,
    dias: d.jabasProyectadas.map((jabasProyectadas, i) => {
      const dia: CursoDia = {
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
      }
      const jornada = jornadaCerrada?.(dia.fecha)
      return jornada ? desdeJornada(dia, jornada) : dia
    }),
  }
}
