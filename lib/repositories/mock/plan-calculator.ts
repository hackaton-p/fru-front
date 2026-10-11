import type {
  AreaCodigo,
  EscenarioCosecha,
  EstadoDia,
  ParametrosPlanta,
  PlanCalculado,
  PlanDia,
  PlanDiaArea,
  ProyeccionCosechaDia,
} from "@/lib/domain"

/*
 * Réplica de PlanCalculatorService del back (contexto §4) usada SOLO por los
 * repositorios mock. La fuente de verdad del cálculo es el back.
 */

export const FACTOR_ESCENARIO: Record<EscenarioCosecha, number> = {
  PROYECTADA: 1,
  "+10": 1.1,
  "+20": 1.2,
  "-10": 0.9,
}

/** Proporción observada en la semana 41. Packing se queda con el resto. */
export const PROPORCION_AREAS: Record<Exclude<AreaCodigo, "PACKING">, number> = {
  ALMACEN: 0.039,
  TRAZABILIDAD: 0.025,
  MANTENIMIENTO: 0.021,
  SANEAMIENTO: 0.045,
}

export function repartirPorArea(total: number): PlanDiaArea[] {
  const apoyo = (Object.entries(PROPORCION_AREAS) as [AreaCodigo, number][]).map(
    ([area, proporcion]) => ({ area, trabajadoresPlan: Math.round(total * proporcion) }),
  )
  const packing = total - apoyo.reduce((s, a) => s + a.trabajadoresPlan, 0)
  return [{ area: "PACKING", trabajadoresPlan: packing }, ...apoyo]
}

export function estadoDelDia(horas: number, margen: number, p: ParametrosPlanta): EstadoDia {
  if (horas > p.horasJornada + p.horasExtraMax) return "RIESGO_TURNO_EXTRA"
  if (horas > p.horasJornada) return "HORAS_EXTRA"
  if (margen * 100 < p.toleranciaVolumen) return "MARGEN_BAJO"
  return "DENTRO_JORNADA"
}

export function calcularDia(
  dia: ProyeccionCosechaDia,
  factor: number,
  p: ParametrosPlanta,
): PlanDia {
  const jabasMeta = dia.jabas * factor
  if (jabasMeta === 0) return { fecha: dia.fecha, jabasMeta, trabajadores: 0, horas: 0, margen: 0, estadoDia: "DENTRO_JORNADA", areas: repartirPorArea(0) }
  const ritmoPersona = p.rendimientoPersonaHora * p.factorEficiencia
  const requeridos = Math.ceil(jabasMeta / (ritmoPersona * p.horasJornada))
  const trabajadores = Math.max(1, Math.min(requeridos, Math.round(p.personalMaximo)))
  const horas = jabasMeta / (trabajadores * ritmoPersona)
  const margen = (trabajadores * ritmoPersona * (p.horasJornada + p.horasExtraMax)) / jabasMeta - 1
  return {
    fecha: dia.fecha,
    jabasMeta,
    trabajadores,
    horas,
    margen,
    estadoDia: estadoDelDia(horas, margen, p),
    areas: repartirPorArea(trabajadores),
  }
}

export interface CalcularPlanArgs {
  cosecha: ProyeccionCosechaDia[]
  totalComercial: number
  comercialPorFruta?: { frutaId: number; jabas: number }[]
  parametros: ParametrosPlanta
  parametrosModificados: boolean
  escenarioCosecha: EscenarioCosecha
}

export function calcularPlan(args: CalcularPlanArgs): PlanCalculado {
  const factor = FACTOR_ESCENARIO[args.escenarioCosecha]
  const grouped = new Map<string, ProyeccionCosechaDia[]>()
  for (const row of args.cosecha) grouped.set(row.fecha, [...(grouped.get(row.fecha) ?? []), row])
  const remaining = new Map((args.comercialPorFruta ?? []).map((row) => [row.frutaId, row.jabas]))
  const dias = [...grouped.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([fecha, rows]) => {
    const fruitMeta = rows.filter((row): row is typeof row & { frutaId: number } => row.frutaId !== undefined).flatMap((row) => {
      if (!args.comercialPorFruta) return [{ frutaId: row.frutaId, fruta: row.fruta ?? `Fruta ${row.frutaId}`, jabasMeta: row.jabas * factor }]
      const target = Math.min(row.jabas * factor, remaining.get(row.frutaId) ?? 0)
      remaining.set(row.frutaId, Math.max(0, (remaining.get(row.frutaId) ?? 0) - target))
      return target > 0 ? [{ frutaId: row.frutaId, fruta: row.fruta ?? `Fruta ${row.frutaId}`, jabasMeta: target }] : []
    })
    const target = args.comercialPorFruta ? fruitMeta.reduce((sum, row) => sum + row.jabasMeta, 0) : rows.reduce((sum, row) => sum + row.jabas, 0)
    const day = calcularDia({ fecha, jabas: target }, args.comercialPorFruta ? 1 : factor, args.parametros)
    day.frutaMeta = fruitMeta
    return day
  })
  const n = dias.length || 1
  const sum = (fn: (d: PlanDia) => number) => dias.reduce((s, d) => s + fn(d), 0)
  const jabasMeta = sum((d) => d.jabasMeta)

  return {
    escenarioCosecha: args.escenarioCosecha,
    parametrosUsados: args.parametros,
    parametrosModificados: args.parametrosModificados,
    dias,
    totales: {
      jabasMeta,
      trabajadoresPico: Math.max(0, ...dias.map((d) => d.trabajadores)),
      trabajadoresPromedio: sum((d) => d.trabajadores) / n,
      horasTotal: sum((d) => d.horas),
      horasPromedio: sum((d) => d.horas) / n,
      cumplimientoComercial: args.totalComercial > 0 ? jabasMeta / args.totalComercial : 1,
    },
  }
}
