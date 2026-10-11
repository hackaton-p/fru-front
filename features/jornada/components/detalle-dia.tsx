import { EstadoDiaBadge } from "@/components/shared/estado-badges"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { jabasATon, type Jornada, type PlanDia } from "@/lib/domain"
import { capitalize, formatDecimal, formatDiaLargo, formatHoras, formatInt } from "@/lib/format"
import { horasVigentes } from "../lib/jornada"

interface DetalleDiaProps {
  dia: PlanDia
  jornada: Jornada | null
}

function Dato({ label, value, hint }: { label: string; value: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-1">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="font-heading text-2xl font-bold tabular-nums">{value}</dd>
      {hint ? <dd className="text-xs text-muted-foreground">{hint}</dd> : null}
    </div>
  )
}

/** Resumen del día que toca: jabas, toneladas, trabajadores, horas y estado. */
export function DetalleDia({ dia, jornada }: DetalleDiaProps) {
  // Con la jornada abierta, el volumen y las horas son los vigentes; cerrada, lo trabajado.
  const jabas = jornada?.cierre?.jabasProcesadas ?? jornada?.estimacion.volumenDia ?? dia.jabasMeta
  const horas = jornada?.cierre
    ? { valor: jornada.cierre.horasTrabajadas, hint: "trabajadas" }
    : jornada
      ? { valor: jornada.estimacion.horasEstimadas, hint: `estimadas · plan ${formatHoras(horasVigentes(dia))}` }
      : { valor: horasVigentes(dia), hint: "del plan" }
  const estado = !jornada ? "Por iniciar" : jornada.estado === "ABIERTA" ? "En curso" : "Cerrada"

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Detalle del día · {capitalize(formatDiaLargo(dia.fecha))}</CardTitle>
      </CardHeader>
      <CardContent>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-3 lg:grid-cols-5">
          <Dato
            label={jornada?.cierre ? "Jabas procesadas" : "Jabas"}
            value={formatInt(jabas)}
            hint={jabas !== dia.jabasMeta ? `meta ${formatInt(dia.jabasMeta)}` : "meta del plan"}
          />
          <Dato label="Toneladas" value={`${formatDecimal(jabasATon(jabas))} t`} hint="equivalente" />
          <Dato
            label="Trabajadores estimados"
            value={formatInt(dia.trabajadores)}
            hint={jornada ? `${formatInt(jornada.estimacion.trabajadoresPresentes)} presentes` : "del plan"}
          />
          <Dato label="Horas" value={formatHoras(horas.valor)} hint={horas.hint} />
          <div className="col-span-2 flex flex-col gap-1 sm:col-span-1">
            <dt className="text-sm text-muted-foreground">Estado</dt>
            <dd className="font-heading text-2xl font-bold">{estado}</dd>
            <dd>
              <EstadoDiaBadge estado={dia.estadoDia} />
            </dd>
          </div>
        </dl>
      </CardContent>
    </Card>
  )
}
