import { AREAS, type CursoDia, type CursoSemana, type PersonalPorArea } from "@/lib/domain"
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
 * personal → horas y rendimiento.
 */
export function lecturaSemana(
  curso: CursoSemana,
  resumen: ResumenCurso,
  horasJornada: number,
): string[] {
  const { cerrados } = resumen
  const lectura: string[] = []

  // Solo los días cerrados: los que siguen en curso o pendientes aún no tienen personal ejecutado.
  const proyectado = cerrados.map((d) => totalPersonal(d.personalProyectado))
  const ejecutado = cerrados.map((d) => totalPersonal(d.personalEjecutado))
  const faltaPacking = avg(
    cerrados.map((d) => d.personalProyectado.PACKING - d.personalEjecutado.PACKING),
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
      label: "Rendimiento (jabas por persona-hora)",
      destacada: true,
      dias: porDia((d) => formatDecimal(rendimientoDia(d))),
      semana: { valor: formatDecimal(r.rendimiento) },
    },
    {
      tipo: "dato",
      label: "Personal proyectado",
      dias: dias.map((d) => ({ valor: formatInt(totalPersonal(d.personalProyectado)) })),
      semana: { valor: formatInt(sum(dias.map((d) => totalPersonal(d.personalProyectado)))) },
    },
    {
      // Solo con la jornada cerrada; la semana suma los días cerrados.
      tipo: "dato",
      label: "Personal ejecutado",
      dias: porDia((d) => formatInt(totalPersonal(d.personalEjecutado)), {
        bajo: (d) => totalPersonal(d.personalEjecutado) < totalPersonal(d.personalProyectado),
        abierto: EN_CURSO,
      }),
      semana: { valor: formatInt(r.personalEjecutado), bajo: r.personalEjecutado < r.personalProyectado },
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
