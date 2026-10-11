import { formatInt } from "@/lib/format"
import type { DashboardPlant } from "./schema"

export type Tone = "success" | "warning" | "danger"
export interface Metric { label: string; value: string; note: string; tone: Tone }
export interface ChartSeries { label: string; color: string; values: (number | null)[] }
export interface ChartDefinition {
  id: string; title: string; description: string; series: ChartSeries[];
  summary: string; unit?: string; max?: number;
  reference?: { value: number; label: string };
}

const ratio = (a: number, b: number) => b > 0 ? a / b : 0
const round = (n: number) => Math.round(n * 10) / 10
const green = "var(--chart-1)", amber = "var(--chart-2)"

/** Los acumulados incluyen únicamente jornadas cerradas, nunca el día en curso. */
export function buildDashboard(plant: DashboardPlant) {
  const closed = plant.days.filter(d => d.closed && d.executedCrates !== null && d.hours !== null && d.executedStaff !== null && d.discardPercent !== null)
  const sum = (get: (d: DashboardPlant["days"][number]) => number) => closed.reduce((total, d) => total + get(d), 0)
  const crates = sum(d => d.executedCrates!), projected = sum(d => d.projectedCrates)
  const staff = sum(d => d.executedStaff!), plannedStaff = sum(d => d.projectedStaff)
  const compliance = ratio(crates, projected) * 100, staffRatio = ratio(staff, plannedStaff) * 100
  const hours = ratio(sum(d => d.hours!), closed.length)
  const yieldRate = round(ratio(crates, sum(d => d.executedStaff! * d.hours!)))
  const discard = ratio(sum(d => d.discardPercent!), closed.length)
  const overtime = closed.filter(d => d.hours! > plant.shiftHours).length
  const empty = closed.length === 0
  const metrics: Metric[] = [
    { label: "Cumplimiento de jabas", value: compliance.toFixed(1) + "%", note: compliance >= 98 ? "en meta" : "bajo la proyección", tone: compliance >= 98 ? "success" : compliance >= 93 ? "warning" : "danger" },
    { label: "Horas de operación", value: hours.toFixed(1) + " h", note: `promedio · jornada ${plant.shiftHours} h`, tone: hours <= plant.shiftHours ? "success" : hours <= plant.shiftHours + 2 ? "warning" : "danger" },
    { label: "Días con horas extra", value: `${overtime} de ${closed.length}`, note: overtime ? `pasaron la jornada de ${plant.shiftHours} h` : "todos dentro de la jornada", tone: overtime > 1 ? "danger" : overtime ? "warning" : "success" },
    { label: "Personal ejecutado", value: Math.round(staffRatio) + "%", note: "del proyectado", tone: staffRatio < 90 ? "danger" : staffRatio > 105 ? "warning" : "success" },
    { label: "Rendimiento", value: yieldRate.toFixed(1), note: `jabas por persona-hora · default ${plant.defaultYield}`, tone: yieldRate >= plant.defaultYield ? "success" : "warning" },
    { label: "Descarte", value: discard.toFixed(1) + "%", note: "promedio de la semana", tone: discard > 9 ? "warning" : "success" },
  ]
  const lowDays = closed.filter(d => ratio(d.executedCrates!, d.projectedCrates) < .95).map(d => d.label)
  const longest = closed.reduce<typeof closed[number] | undefined>((max, d) => !max || d.hours! > max.hours! ? d : max, undefined)
  const comparison = yieldRate > plant.defaultYield ? "sobre" : yieldRate < plant.defaultYield ? "bajo" : "en línea con"
  const insights = [
    { title: `Rendimiento ${comparison} el default`, text: `Se procesaron ${yieldRate.toFixed(1)} jabas por persona-hora contra ${plant.defaultYield} de la configuración de planta. ${yieldRate > plant.defaultYield ? "El plan podría proponer algo menos de personal u horas." : yieldRate < plant.defaultYield ? "Con este ritmo el plan subestima las horas necesarias." : "El default de la planta refleja bien lo que pasa en piso."}` },
    { title: staffRatio < 95 ? "Falta personal" : staffRatio > 105 ? "Personal por encima de lo proyectado" : "Personal en línea con lo proyectado", text: `Se tuvo el ${Math.round(staffRatio)}% del personal proyectado (${formatInt(staff)} de ${formatInt(plannedStaff)} en ${closed.length} días).` },
    { title: "Días bajo la proyección", text: `${lowDays.length ? lowDays.join(", ") + " quedaron por debajo del 95% de jabas." : "Todos los días cerrados llegaron al 95% de jabas."}${longest ? ` El día más largo fue ${longest.label} con ${longest.hours} h.` : ""}` },
  ]
  const values = (get: (d: DashboardPlant["days"][number]) => number | null) => plant.days.map(get)
  const series = (label: string, v: (number | null)[], color = green): ChartSeries => ({ label, values: v, color })
  const charts: ChartDefinition[] = [
    { id: "crates", title: "Jabas: proyectadas vs ejecutadas", description: "Fruta que llegó y se procesó contra lo que proyectó cosecha", series: [series("Proyectadas", values(d => d.projectedCrates), amber), series("Ejecutadas", values(d => d.executedCrates))], summary: `Semana: ${formatInt(crates)} de ${formatInt(projected)} jabas en días cerrados (${compliance.toFixed(1)}%).` },
    { id: "hours", title: "Horas de operación por día", description: `Horas reales trabajadas; la línea punteada es la jornada de ${plant.shiftHours} h`, series: [series("Horas", values(d => d.hours))], max: 14, unit: " h", reference: { value: plant.shiftHours, label: `Jornada ${plant.shiftHours} h` }, summary: `Promedio ${hours.toFixed(1)} h por día.` },
    { id: "worker", title: "Jabas por trabajador", description: "Jabas procesadas en el día divididas entre el personal ejecutado", series: [series("Jabas / trabajador", values(d => d.executedCrates === null || !d.executedStaff ? null : Math.round(d.executedCrates / d.executedStaff)))], summary: `Promedio ${formatInt(ratio(crates, staff))} jabas por trabajador en días cerrados.` },
    { id: "staff", title: "Personal: proyectado vs ejecutado", description: "Total de todas las áreas (packing, almacén, trazabilidad, mantenimiento, saneamiento)", series: [series("Proyectado", values(d => d.projectedStaff), amber), series("Ejecutado", values(d => d.executedStaff))], summary: `Se tuvo el ${Math.round(staffRatio)}% del personal proyectado en días cerrados.` },
    { id: "yield", title: "Rendimiento por persona-hora", description: "Jabas procesadas ÷ (personal × horas); la línea punteada es el default de la planta", series: [series("Jabas / persona-hora", values(d => d.executedCrates === null || !d.executedStaff || !d.hours ? null : round(d.executedCrates / (d.executedStaff * d.hours))))], max: 8, reference: { value: plant.defaultYield, label: `Default ${plant.defaultYield}` }, summary: `Promedio ${yieldRate.toFixed(1)} jabas por persona-hora.` },
    { id: "discard", title: "% de descarte", description: "Fruta descartada sobre la procesada", series: [series("Descarte", values(d => d.discardPercent))], max: 12, unit: "%", summary: `Promedio ${discard.toFixed(1)}% de descarte.` },
  ]
  return {
    metrics: empty ? metrics.map(m => ({ ...m, note: "Sin jornadas cerradas", tone: "warning" as const })) : metrics,
    insights: empty ? [
      { title: "Sin jornadas cerradas", text: "Los indicadores se muestran en cero hasta cerrar la primera jornada." },
      { title: "Personal pendiente", text: "Aún no hay datos cerrados de personal para esta semana." },
      { title: "Producción pendiente", text: "Aún no hay datos cerrados de producción para esta semana." },
    ] : insights,
    charts: charts.map(c => ({ ...c, series: c.series.map(s => ({ ...s, values: s.values.map(v => v ?? 0) })) })),
  }
}
