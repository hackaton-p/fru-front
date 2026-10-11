import { CircleCheck, CircleDashed, Play, type LucideIcon } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { EjecucionDia, JornadaDelDia, PlanEnEjecucion } from "@/lib/domain"
import { formatDia, formatInt } from "@/lib/format"
import { cn } from "@/lib/utils"

const EJECUCION_UI: Record<EjecucionDia, { label: string; icon: LucideIcon; className: string }> = {
  PENDIENTE: { label: "Pendiente", icon: CircleDashed, className: "text-muted-foreground" },
  ABIERTA: { label: "En curso", icon: Play, className: "text-foreground" },
  CERRADA: { label: "Cerrada", icon: CircleCheck, className: "text-success-foreground" },
}

interface PlanesAprobadosProps {
  planes: PlanEnEjecucion[]
  /** Día que toca ejecutar, para marcarlo como actual. */
  actual: JornadaDelDia | null
}

/** Días de los planes aprobados: día, jabas, estado y cuál es el actual. */
export function PlanesAprobados({ planes, actual }: PlanesAprobadosProps) {
  const activos = planes
    .filter((p) => p.plan.estado === "APROBADO" || p.plan.estado === "EN_EJECUCION")
    // La semana más próxima a ejecutar primero.
    .reverse()
  if (activos.length === 0) return null

  return (
    <section aria-labelledby="planes-aprobados" className="flex flex-col gap-4">
      <h2 id="planes-aprobados" className="font-heading text-2xl font-bold tracking-tight">
        Planes aprobados
      </h2>
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        {activos.map(({ plan, ejecucion }) => (
          <Card key={plan.id} size="sm">
            <CardHeader>
              <CardTitle>Semana {plan.semana}</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Día</TableHead>
                    <TableHead className="text-right">Jabas</TableHead>
                    <TableHead>Estado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {plan.dias.map((d) => {
                    const ui = EJECUCION_UI[ejecucion[d.fecha] ?? "PENDIENTE"]
                    const esActual = actual?.plan.id === plan.id && actual.dia.fecha === d.fecha
                    return (
                      <TableRow
                        key={d.fecha}
                        aria-current={esActual ? "date" : undefined}
                        className={cn(esActual && "bg-primary/10 hover:bg-primary/10")}
                      >
                        <TableCell className="font-medium">
                          {formatDia(d.fecha)}
                          {esActual ? (
                            <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
                              Actual
                            </span>
                          ) : null}
                        </TableCell>
                        <TableCell className="text-right tabular-nums">{formatInt(d.jabasMeta)}</TableCell>
                        <TableCell>
                          <span className={cn("flex items-center gap-1.5 text-sm font-medium", ui.className)}>
                            <ui.icon aria-hidden className="size-4" />
                            {ui.label}
                          </span>
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>
  )
}
