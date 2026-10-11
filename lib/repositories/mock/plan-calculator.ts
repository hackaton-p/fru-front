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
  parametros: ParametrosPlanta
  parametrosModificados: boolean
  escenarioCosecha: EscenarioCosecha
}

export function calcularPlan(args: CalcularPlanArgs): PlanCalculado {
  const factor = FACTOR_ESCENARIO[args.escenarioCosecha]
  const dias = args.cosecha.map((d) => calcularDia(d, factor, args.parametros))
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
