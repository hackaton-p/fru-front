import { AREAS, type AreaCodigo, type CursoDia, type CursoSemana, type PersonalPorArea } from "@/lib/domain"
import { formatDecimal, formatInt, formatPercent } from "@/lib/format"

/*
 * Métricas del curso de la semana (contexto §6, "Métricas calculadas"):
 * cumplimiento = ejecutadas ÷ proyectadas, rendimiento = jabas ejecutadas ÷
 * personal ejecutado ÷ horas. Solo cuentan los días con la jornada cerrada.
 */

/** Día con la jornada cerrada (ya tiene jabas, horas, peso y descarte). */
export interface DiaCerrado extends CursoDia {
  jabasEjecutadas: number
  horas: number
  pesoLoose: number
  descarte: number
}

export function estaCerrado(dia: CursoDia): dia is DiaCerrado {
  return (
    dia.jabasEjecutadas !== null &&
    dia.horas !== null &&
    dia.pesoLoose !== null &&
    dia.descarte !== null
  )
}

export function totalPersonal(personal: PersonalPorArea): number {
  return AREAS.reduce((s, area) => s + personal[area], 0)
}

/** Jabas por persona-hora de un día cerrado. */
export function rendimientoDia(dia: DiaCerrado): number {
  return dia.jabasEjecutadas / (totalPersonal(dia.personalEjecutado) * dia.horas)
}

const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)
const avg = (xs: number[]) => (xs.length ? sum(xs) / xs.length : 0)

export interface ResumenCurso {
  cerrados: DiaCerrado[]
  /** Jornadas abiertas (sin cierre todavía). */
  enCurso: CursoDia[]
  jabasEjecutadas: number
  /** Proyectado de los días cerrados, para comparar contra lo ejecutado. */
  jabasProyectadasCerradas: number
  cumplimiento: number
  horasTotal: number
  horasPromedio: number
  horasMin: number
  horasMax: number
  rendimiento: number
  personalProyectado: number
  personalEjecutado: number
  /** Personal ejecutado ÷ proyectado en los días cerrados. */
  personalEjecutadoRatio: number
  descartePromedio: number
  descarteUltimo: number
}

/** Resumen de la semana, o null si todavía no se cerró ninguna jornada. */
export function resumirCurso(curso: CursoSemana): ResumenCurso | null {
  const cerrados = curso.dias.filter(estaCerrado)
  if (cerrados.length === 0) return null

  const jabasEjecutadas = sum(cerrados.map((d) => d.jabasEjecutadas))
  const jabasProyectadasCerradas = sum(cerrados.map((d) => d.jabasProyectadas))
  const horas = cerrados.map((d) => d.horas)
  const horasTotal = sum(horas)
  const personaHoras = sum(cerrados.map((d) => totalPersonal(d.personalEjecutado) * d.horas))
  const personalProyectado = sum(cerrados.map((d) => totalPersonal(d.personalProyectado)))
  const personalEjecutado = sum(cerrados.map((d) => totalPersonal(d.personalEjecutado)))

  return {
    cerrados,
    enCurso: curso.dias.filter((d) => !estaCerrado(d)),
    jabasEjecutadas,
    jabasProyectadasCerradas,
    cumplimiento: jabasEjecutadas / jabasProyectadasCerradas,
    horasTotal,
    horasPromedio: horasTotal / cerrados.length,
    horasMin: Math.min(...horas),
    horasMax: Math.max(...horas),
    rendimiento: jabasEjecutadas / personaHoras,
    personalProyectado,
    personalEjecutado,
    personalEjecutadoRatio: personalEjecutado / personalProyectado,
    descartePromedio: avg(cerrados.map((d) => d.descarte)),
    descarteUltimo: cerrados[cerrados.length - 1].descarte,
  }
}

const horasTxt = (h: number) => `${formatDecimal(h)} h`

/**
 * "Lectura de la semana": hallazgos calculados con los datos, en el orden
 * personal → horas, rendimiento y descarte.
 */
export function lecturaSemana(
  curso: CursoSemana,
  resumen: ResumenCurso,
  horasJornada: number,
): string[] {
  const { cerrados } = resumen
  const lectura: string[] = []

  const proyectado = curso.dias.map((d) => totalPersonal(d.personalProyectado))
  const ejecutado = curso.dias.map((d) => totalPersonal(d.personalEjecutado))
  const faltaPacking = avg(
    curso.dias.map((d) => d.personalProyectado.PACKING - d.personalEjecutado.PACKING),
  )
  const horasSuben = cerrados.every((d, i) => i === 0 || d.horas >= cerrados[i - 1].horas)
  let personal =
    `Se proyectaron ${formatInt(Math.min(...proyectado))} a ${formatInt(Math.max(...proyectado))} ` +
    `personas por día y se tuvieron ${formatInt(Math.min(...ejecutado))} a ${formatInt(Math.max(...ejecutado))}.`
  if (faltaPacking >= 1 && horasSuben && resumen.horasMax > resumen.horasMin) {
    personal +=
      ` La falta de personal de packing (~${formatInt(faltaPacking)} personas por día) explica ` +
      `que las horas suban de ${horasTxt(resumen.horasMin)} a ${horasTxt(resumen.horasMax)}.`
  }
  lectura.push(personal)

  const rendimientos = cerrados.map(rendimientoDia)
  // Con el personal proyectado y el ritmo real de cada día, ¿cabía en la jornada?
  const cabiaEnJornada = cerrados.every(
    (d, i) => d.jabasEjecutadas / (totalPersonal(d.personalProyectado) * rendimientos[i]) <= horasJornada,
  )
  lectura.push(
    `El rendimiento se mantiene entre ${formatDecimal(Math.min(...rendimientos))} y ` +
      `${formatDecimal(Math.max(...rendimientos))} jabas por persona-hora` +
      (cabiaEnJornada
        ? "; con el personal planificado, los días cerrarían dentro de la jornada."
        : "."),
  )

  const primero = cerrados[0].descarte
  const ultimo = resumen.descarteUltimo
  if (cerrados.length > 1 && ultimo !== primero) {
    const verbo = ultimo > primero ? "subió" : "bajó"
    lectura.push(
      `El descarte ${verbo} de ${formatPercent(primero)} a ${formatPercent(ultimo)} a lo largo de la semana.`,
    )
  } else {
    lectura.push(`El descarte se mantuvo en ${formatPercent(ultimo)}.`)
  }

  return lectura
}

/* Tabla "Proyectado vs ejecutado": una columna por día y una de semana. */

export interface CeldaCurso {
  valor: string
  /** Ejecutado por debajo de lo proyectado. */
  bajo?: boolean
}

export type FilaCurso =
  | { tipo: "seccion"; label: string }
  | {
      tipo: "dato"
      label: string
      dias: CeldaCurso[]
      semana: CeldaCurso
      /** Filas de totales o de lectura principal (en negrita). */
      destacada?: boolean
      /** Filas por área dentro de una sección. */
      anidada?: boolean
    }

const AREA_LABEL: Record<AreaCodigo, string> = {
  PACKING: "Packing",
  ALMACEN: "Almacén",
  TRAZABILIDAD: "Trazabilidad",
  MANTENIMIENTO: "Mantenimiento",
  SANEAMIENTO: "Saneamiento",
}

const EN_CURSO = "en curso"
const SIN_DATO = "—"

export function filasCurso(curso: CursoSemana, resumen: ResumenCurso): FilaCurso[] {
  const { dias } = curso
  const cerrado = dias.map(estaCerrado)
  const r = resumen

  const porDia = (
    valor: (d: DiaCerrado) => string,
    opts: { bajo?: (d: DiaCerrado) => boolean; abierto?: string } = {},
  ): CeldaCurso[] =>
    dias.map((d) =>
      estaCerrado(d)
        ? { valor: valor(d), bajo: opts.bajo?.(d) }
        : { valor: opts.abierto ?? SIN_DATO },
    )

  const personal = (fuente: "personalProyectado" | "personalEjecutado"): FilaCurso[] => [
    ...AREAS.map(
      (area): FilaCurso => ({
        tipo: "dato",
        label: AREA_LABEL[area],
        anidada: true,
        dias: dias.map((d) => ({
          valor: formatInt(d[fuente][area]),
          bajo: fuente === "personalEjecutado" && d.personalEjecutado[area] < d.personalProyectado[area],
        })),
        semana: { valor: SIN_DATO },
      }),
    ),
    {
      tipo: "dato",
      label: fuente === "personalProyectado" ? "Total proyectado" : "Total ejecutado",
      anidada: true,
      destacada: true,
      dias: dias.map((d) => ({
        valor: formatInt(totalPersonal(d[fuente])),
        bajo:
          fuente === "personalEjecutado" &&
          totalPersonal(d.personalEjecutado) < totalPersonal(d.personalProyectado),
      })),
      semana: {
        valor: formatInt(sum(dias.map((d) => totalPersonal(d[fuente])))),
        bajo:
          fuente === "personalEjecutado" &&
          sum(dias.map((d) => totalPersonal(d.personalEjecutado))) <
            sum(dias.map((d) => totalPersonal(d.personalProyectado))),
      },
    },
  ]

  const bajoMeta = (d: DiaCerrado) => d.jabasEjecutadas < d.jabasProyectadas
  const semanaBaja = r.jabasEjecutadas < r.jabasProyectadasCerradas

  return [
    {
      tipo: "dato",
      label: "Jabas proyectadas",
      destacada: true,
      dias: dias.map((d) => ({ valor: formatInt(d.jabasProyectadas) })),
      semana: { valor: formatInt(sum(dias.map((d) => d.jabasProyectadas))) },
    },
    {
      tipo: "dato",
      label: "Jabas ejecutadas",
      destacada: true,
      dias: porDia((d) => formatInt(d.jabasEjecutadas), { bajo: bajoMeta, abierto: EN_CURSO }),
      semana: { valor: formatInt(r.jabasEjecutadas), bajo: semanaBaja },
    },
    {
      tipo: "dato",
      label: "Cumplimiento",
      dias: porDia((d) => formatPercent(d.jabasEjecutadas / d.jabasProyectadas), { bajo: bajoMeta }),
      semana: { valor: formatPercent(r.cumplimiento), bajo: semanaBaja },
    },
    {
      tipo: "dato",
      label: "% peso loose",
      dias: porDia((d) => formatPercent(d.pesoLoose)),
      semana: { valor: formatPercent(avg(r.cerrados.map((d) => d.pesoLoose))) },
    },
    {
      tipo: "dato",
      label: "% peso fijo",
      dias: porDia((d) => formatPercent(1 - d.pesoLoose)),
      semana: { valor: formatPercent(1 - avg(r.cerrados.map((d) => d.pesoLoose))) },
    },
    {
      tipo: "dato",
      label: "Rendimiento (jabas por persona-hora)",
      destacada: true,
      dias: porDia((d) => formatDecimal(rendimientoDia(d))),
      semana: { valor: formatDecimal(r.rendimiento) },
    },
    {
      tipo: "dato",
      label: "% descarte",
      dias: porDia((d) => formatPercent(d.descarte)),
      semana: { valor: formatPercent(r.descartePromedio) },
    },
    { tipo: "seccion", label: "Personal proyectado" },
    ...personal("personalProyectado"),
    { tipo: "seccion", label: "Personal ejecutado" },
    ...personal("personalEjecutado"),
    {
      tipo: "dato",
      label: "Ingresos",
      dias: dias.map((d) => ({ valor: formatInt(d.ingresos) })),
      semana: { valor: formatInt(sum(dias.map((d) => d.ingresos))) },
    },
    {
      tipo: "dato",
      label: "Ausentismo",
      dias: dias.map((d) => ({ valor: formatPercent(d.ausentismo) })),
      semana: { valor: formatPercent(avg(dias.map((d) => d.ausentismo))) },
    },
    {
      tipo: "dato",
      label: "Horas totales",
      dias: dias.map((d, i) =>
        cerrado[i] ? { valor: formatDecimal(d.horas!, 2) } : { valor: EN_CURSO },
      ),
      semana: { valor: formatDecimal(r.horasTotal, 2) },
    },
  ]
}
