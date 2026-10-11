import { StatCard } from "@/components/shared/stat-card"
import type { Jornada, ParametrosPlanta, PlanDia } from "@/lib/domain"
import { formatDecimal, formatHoras, formatInt } from "@/lib/format"
import { cn } from "@/lib/utils"
import {
  clasificarHoras,
  horaDe,
  horaFin,
  horasVigentes,
  personasAdicionales,
  totalInicio,
} from "../lib/jornada"
import { AjustarHorasButton } from "./ajustar-horas-button"
import { ESTADO_HORAS_UI, MOTIVO_LABEL } from "./estado-horas-ui"

interface EstadoJornadaProps {
  jornada: Jornada
  dia: PlanDia
  parametros: ParametrosPlanta
}

function personas(n: number) {
  return n === 1 ? "1 persona más" : `${formatInt(n)} personas más`
}

/** Etapa 2: estado de la jornada (¿cabe en las horas?), ajuste de horas y KPIs. */
export function EstadoJornada({ jornada, dia, parametros: p }: EstadoJornadaProps) {
  const est = jornada.estimacion
  const vigentes = horasVigentes(dia)
  const estado = clasificarHoras(est.horasEstimadas, vigentes, p)
  const ui = ESTADO_HORAS_UI[estado]
  const inicio = horaDe(jornada.horaInicio)
  const fin = horaFin(inicio, est.horasEstimadas)
  const tope = p.horasJornada + p.horasExtraMax

  let detalle: string
  if (estado === "EN_PLAN") {
    detalle = `Con el ritmo y el personal actual terminas en ${formatHoras(est.horasEstimadas)}, cerca de las ${fin}.`
  } else if (estado === "HORAS_EXTRA") {
    const faltan = personasAdicionales(est, vigentes)
    detalle =
      `Al ritmo actual terminas en ${formatHoras(est.horasEstimadas)} (${fin}) y el plan tiene ${formatHoras(vigentes)}.` +
      (faltan ? ` Para cumplir el plan necesitas ${personas(faltan)}.` : "")
  } else {
    const faltan = personasAdicionales(est, tope)
    detalle =
      `Al ritmo actual terminas en ${formatHoras(est.horasEstimadas)}, más que la jornada y las horas extra (${formatInt(tope)} h).` +
      (faltan ? ` Para terminar en ${formatInt(tope)} h necesitas ${personas(faltan)}.` : "")
  }

  const propuesta = Math.round(est.horasEstimadas * 10) / 10
  const puedeAjustar =
    estado !== "EN_PLAN" &&
    (dia.horasActualizadas == null || Math.abs(dia.horasActualizadas - propuesta) > 0.05)

  const desvioVolumen = est.volumenDia / dia.jabasMeta - 1
  const trabajadoresPlan = dia.trabajadores

  return (
    <>
      {/* El estimado en horas es la respuesta de la pantalla: a escala de display y con el color del estado. */}
      <section
        role="status"
        aria-live="polite"
        aria-label="Estado de la jornada"
        className={cn(
          "grid grid-cols-1 gap-x-8 gap-y-4 rounded-xl border px-5 py-4 sm:grid-cols-[auto_1fr] sm:items-center",
          ui.superficie,
        )}
      >
        <div className="flex flex-col gap-1">
          <span className="text-sm font-medium text-foreground">Terminas en aprox.</span>
          <span className={cn("font-heading text-6xl leading-none font-bold tabular-nums", ui.texto)}>
            {formatHoras(est.horasEstimadas)}
          </span>
          <span className="text-sm text-foreground">
            fin aprox. <strong>{fin}</strong> · vigente {formatHoras(vigentes)}
          </span>
        </div>
        <div className="flex flex-col gap-3 text-foreground">
          <h2 className={cn("flex items-center gap-2 font-heading text-xl font-bold", ui.texto)}>
            <ui.icon aria-hidden className="size-5 shrink-0" />
            {ui.titulo}
          </h2>
          <p className="max-w-prose text-pretty">{detalle}</p>
          {puedeAjustar ? (
            <div className="flex flex-wrap items-center gap-3">
              <AjustarHorasButton jornadaId={jornada.id} horas={est.horasEstimadas} motivo={est.motivoSugerido} />
              <span className="text-sm">Motivo: {MOTIVO_LABEL[est.motivoSugerido]}</span>
            </div>
          ) : null}
        </div>
      </section>

      {dia.horasActualizadas != null ? (
        <p className="text-sm text-muted-foreground">
          Horas actualizadas: {formatHoras(dia.horas)} → {formatHoras(dia.horasActualizadas)}
          {dia.motivoAjuste ? ` (motivo: ${MOTIVO_LABEL[dia.motivoAjuste].toLowerCase()})` : ""}
        </p>
      ) : null}

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <StatCard
          label="Trabajadores ahora"
          value={formatInt(est.trabajadoresPresentes)}
          negative={est.trabajadoresPresentes < trabajadoresPlan}
          hint={`plan ${formatInt(trabajadoresPlan)} · iniciaron ${formatInt(totalInicio(jornada))}`}
        />
        <StatCard
          label="Jabas procesadas"
          value={formatInt(est.jabasProcesadas)}
          hint={`de ${formatInt(est.volumenDia)} esperadas hoy`}
        />
        <div className="col-span-2 sm:col-span-1">
          <StatCard
            label="Volumen del día"
            value={formatInt(est.volumenDia)}
            negative={Math.abs(desvioVolumen) * 100 > p.toleranciaVolumen}
            hint={`jabas · ${desvioVolumen >= 0 ? "+" : "−"}${formatDecimal(Math.abs(desvioVolumen) * 100, 0)}% vs meta`}
          />
        </div>
      </div>
      {dia.frutaMeta?.length ? <section aria-label="Cumplimiento por fruta" className="rounded-xl border p-4">
        <h3 className="font-heading text-lg font-semibold">Cumplimiento por fruta</h3>
        <ul className="mt-3 grid gap-3 sm:grid-cols-2">
          {dia.frutaMeta.map((target) => {
            const processed = jornada.jabasPorFruta?.find((row) => row.frutaId === target.frutaId)?.jabas ?? 0
            return <li key={target.frutaId} className="flex items-center justify-between gap-3 rounded-lg bg-muted/50 px-3 py-2">
              <span>{target.fruta}</span>
              <span className="text-right text-sm tabular-nums">{formatInt(processed)} / {formatInt(target.jabasMeta)} jabas</span>
            </li>
          })}
        </ul>
      </section> : null}
    </>
  )
}
