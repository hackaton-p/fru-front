import { CircleCheck, Play, TriangleAlert } from "lucide-react"
import { AREA_LABEL } from "@/components/shared/areas"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Jornada, ParametrosPlanta, PlanDia, RegistroAvance } from "@/lib/domain"
import { formatHoras, formatInt } from "@/lib/format"
import { cn } from "@/lib/utils"
import { clasificarHoras, horaDe, horasVigentes, totalInicio, totalLlegaron } from "../lib/jornada"
import { ESTADO_HORAS_UI } from "./estado-horas-ui"

interface Entrada {
  key: string
  hora: string
  titulo: string
  detalle: string
  alertas: string[]
  horasEstimadas: number
  inicio?: boolean
}

function describir(r: RegistroAvance, meta: number): Pick<Entrada, "titulo" | "detalle"> {
  if (r.tipo === "AVANCE") {
    return {
      titulo: `Avance: ${formatInt(r.jabasProcesadasAcum)} jabas procesadas`,
      detalle: `${formatInt(r.jabasRecibidasAcum)} jabas recibidas`,
    }
  }
  if (r.tipo === "PERSONAL") {
    const n = Math.abs(r.cambioPersonal)
    const personas = n === 1 ? "1 persona" : `${formatInt(n)} personas`
    return {
      titulo:
        r.cambioPersonal > 0
          ? `Llegan ${personas} a ${AREA_LABEL[r.area]}`
          : `Salen ${personas} de ${AREA_LABEL[r.area]}`,
      detalle: `Ahora trabajan ${formatInt(r.trabajadoresPresentes)}`,
    }
  }
  const desvio = (r.jabasEsperadasDia / meta - 1) * 100
  return {
    titulo: `Volumen del día: ${formatInt(r.jabasEsperadasDia)} jabas`,
    detalle: `${desvio >= 0 ? "+" : "−"}${formatInt(Math.abs(desvio))}% vs la meta de ${formatInt(meta)}`,
  }
}

interface RegistrosListProps {
  jornada: Jornada
  dia: PlanDia
  parametros: ParametrosPlanta
}

/** "Registros de hoy": cada registro con el estimado que dejó, el más reciente arriba. */
export function RegistrosList({ jornada, dia, parametros }: RegistrosListProps) {
  const inicio = totalInicio(jornada)
  const entradas: Entrada[] = [
    {
      key: "inicio",
      inicio: true,
      hora: horaDe(jornada.horaInicio),
      titulo: `Inicio con ${formatInt(inicio)} trabajadores`,
      detalle:
        `${formatInt(totalLlegaron(jornada))} llegaron · plan ${formatInt(dia.trabajadores)}` +
        (inicio < dia.trabajadores ? ` · faltan ${formatInt(dia.trabajadores - inicio)}` : ""),
      alertas: [],
      horasEstimadas: jornada.horasEstimadasInicio,
    },
    ...jornada.registros.map((r) => ({
      key: String(r.id),
      hora: horaDe(r.hora),
      ...describir(r, dia.jabasMeta),
      alertas: r.alertas.map((a) => a.mensaje),
      horasEstimadas: r.horasEstimadas,
    })),
  ].reverse()
  const vigentes = horasVigentes(dia)

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Registros de hoy</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="flex flex-col">
          {entradas.map((e, i) => {
            const ui = ESTADO_HORAS_UI[clasificarHoras(e.horasEstimadas, vigentes, parametros)]
            const Icono = e.alertas.length ? TriangleAlert : e.inicio ? Play : CircleCheck
            return (
              <li
                key={e.key}
                className={cn("grid grid-cols-[3.25rem_1.5rem_1fr_auto] gap-x-2 py-3", i > 0 && "border-t")}
              >
                <span className="pt-0.5 font-semibold tabular-nums">{e.hora}</span>
                <Icono
                  aria-hidden
                  className={cn(
                    "mt-1 size-4",
                    e.alertas.length ? "text-destructive" : e.inicio ? "text-foreground" : "text-primary",
                  )}
                />
                <div className="flex min-w-0 flex-col gap-0.5">
                  <span className="font-semibold">{e.titulo}</span>
                  <span className="text-sm text-muted-foreground">{e.detalle}</span>
                  {e.alertas.map((a) => (
                    <span key={a} className="text-sm font-medium text-destructive">
                      Alerta: {a}
                    </span>
                  ))}
                </div>
                <div className="flex flex-col items-end text-right">
                  <span className="text-xs text-muted-foreground">estimado</span>
                  <span className={cn("font-heading text-lg font-bold tabular-nums", ui.texto)}>
                    {formatHoras(e.horasEstimadas)}
                  </span>
                </div>
              </li>
            )
          })}
        </ol>
      </CardContent>
    </Card>
  )
}
