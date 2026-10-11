import { CircleCheck, CircleX } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Jornada, ParametrosPlanta, PlanDia } from "@/lib/domain"
import { formatDecimal, formatHoras, formatInt, formatPercent } from "@/lib/format"
import { cn } from "@/lib/utils"

interface CierreResultadoProps {
  jornada: Jornada
  dia: PlanDia
  parametros: ParametrosPlanta
  /** Acción extra al pie (reiniciar la demo). */
  children?: React.ReactNode
}

/** Resultado de la jornada cerrada: meta cumplida y diferencia. */
export function CierreResultado({ jornada, dia, parametros: p, children }: CierreResultadoProps) {
  const c = jornada.cierre!
  const presentes = jornada.areas.reduce((s, a) => s + a.trabajadoresPresentes, 0)
  const rendimiento = presentes > 0 && c.horasTrabajadas > 0 ? c.jabasProcesadas / (presentes * c.horasTrabajadas) : 0
  const kg = c.kgLoose + c.kgFijo
  const Icono = c.metaCumplida ? CircleCheck : CircleX

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-2xl">
          <Icono
            className={cn("size-6", c.metaCumplida ? "text-primary" : "text-destructive")}
            aria-hidden
          />
          Jornada cerrada · {c.metaCumplida ? "meta cumplida" : "meta no cumplida"}
        </CardTitle>
        {c.diferencia < 0 ? (
          <CardDescription>
            Quedaron {formatInt(-c.diferencia)} jabas sin procesar respecto a la meta.
          </CardDescription>
        ) : null}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-5">
          <StatCard
            label="Jabas procesadas"
            value={formatInt(c.jabasProcesadas)}
            hint={`meta ${formatInt(dia.jabasMeta)}`}
          />
          <StatCard
            label="Diferencia"
            value={`${c.diferencia > 0 ? "+" : c.diferencia < 0 ? "−" : ""}${formatInt(Math.abs(c.diferencia))}`}
            negative={c.diferencia < 0}
            hint="jabas vs meta"
          />
          <StatCard
            label="Horas trabajadas"
            value={formatHoras(c.horasTrabajadas)}
            negative={c.horasTrabajadas > p.horasJornada}
            hint={`plan ${formatHoras(dia.horas)} · jornada ${formatInt(p.horasJornada)} h`}
          />
          <StatCard
            label="Rendimiento real"
            value={formatDecimal(rendimiento)}
            hint={`jabas por persona-hora · default ${formatDecimal(p.rendimientoPersonaHora)}`}
          />
          <StatCard
            label="% descarte"
            value={formatPercent(c.jabasProcesadas > 0 ? c.jabasDescarte / c.jabasProcesadas : 0)}
            hint={`% loose ${formatPercent(kg > 0 ? c.kgLoose / kg : 0, 0)}`}
          />
        </div>
        {children ? <div>{children}</div> : null}
      </CardContent>
    </Card>
  )
}
