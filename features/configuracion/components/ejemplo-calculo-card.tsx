import { TriangleAlert } from "lucide-react"
import { EstadoDiaBadge } from "@/components/shared/estado-badges"
import type { ParametrosPlanta } from "@/lib/domain"
import { formatDia, formatHoras, formatInt } from "@/lib/format"
import { calcularEjemplo } from "../lib/configuracion"
import type { DiaEjemplo } from "../queries"

interface EjemploCalculoCardProps {
  plantaNombre: string
  dia: DiaEjemplo | null
  /** Valores que se están editando; null mientras haya un campo inválido. */
  parametros: ParametrosPlanta | null
  /** Valores guardados, para mostrar cuánto cambia el resultado. */
  guardados: ParametrosPlanta
}

function Fila({
  label,
  valor,
  antes,
}: {
  label: string
  valor: string
  /** Valor con lo guardado, solo si cambió. */
  antes?: string
}) {
  return (
    <div className="flex flex-wrap items-baseline justify-between gap-2 border-t border-border py-2.5 first:border-t-0">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-2 text-right">
        {antes ? (
          <span className="text-sm text-muted-foreground tabular-nums">Antes: {antes}</span>
        ) : null}
        <span className="text-base font-semibold tabular-nums">{valor}</span>
      </dd>
    </div>
  )
}

/**
 * "Así calcula el sistema": lo que el plan propondría para un día real con los
 * valores que se están editando. Se recalcula mientras se escribe.
 */
export function EjemploCalculoCard({
  plantaNombre,
  dia,
  parametros,
  guardados,
}: EjemploCalculoCardProps) {
  return (
    <section
      aria-labelledby="ejemplo-calculo"
      className="flex flex-col gap-3 rounded-xl bg-muted/50 p-4 text-foreground"
    >
      <div className="flex flex-col gap-1">
        <h2 id="ejemplo-calculo" className="text-sm font-semibold">
          Ejemplo · Planta {plantaNombre}
        </h2>
        {dia ? (
          <p className="text-sm text-muted-foreground">
            {formatDia(dia.fecha)} · Semana {dia.semana} · <strong className="text-foreground tabular-nums">{formatInt(dia.jabas)} jabas</strong>
          </p>
        ) : null}
      </div>

      {!dia ? (
        <p className="text-sm text-muted-foreground">
          Importa la cosecha de la próxima semana para ver un ejemplo.
        </p>
      ) : !parametros ? (
        <p role="status" className="text-sm text-muted-foreground">
          Corrige los campos marcados para ver el cálculo.
        </p>
      ) : (
        <Resultado dia={dia} parametros={parametros} guardados={guardados} />
      )}

      <p className="text-xs text-muted-foreground">Vista previa con estos valores. No modifica ningún plan.</p>
    </section>
  )
}

function Resultado({
  dia,
  parametros,
  guardados,
}: {
  dia: DiaEjemplo
  parametros: ParametrosPlanta
  guardados: ParametrosPlanta
}) {
  const r = calcularEjemplo(dia.jabas, parametros)
  const g = calcularEjemplo(dia.jabas, guardados)
  const si = (actual: string, antes: string) => (actual !== antes ? antes : undefined)

  const trabajadores = formatInt(r.trabajadores)
  const horas = formatHoras(r.horas)

  return (
    <div aria-live="polite" className="flex flex-col gap-3">
      <dl className="flex flex-col">
        <Fila
          label="Trabajadores necesarios"
          valor={trabajadores}
          antes={si(trabajadores, formatInt(g.trabajadores))}
        />
        <Fila label="Horas con ese personal" valor={horas} antes={si(horas, formatHoras(g.horas))} />
      </dl>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <EstadoDiaBadge estado={r.estadoDia} />
      </div>
      {r.topeAlcanzado ? (
        <p
          role="status"
          className="flex gap-2 rounded-lg bg-warning px-3 py-2.5 text-sm text-warning-foreground"
        >
          <TriangleAlert aria-hidden className="mt-0.5 size-4 shrink-0" />
          <span>
            Se necesitan {formatInt(r.requeridos)} personas y el máximo es{" "}
            {formatInt(parametros.personalMaximo)}: el plan se calcula con{" "}
            {formatInt(r.trabajadores)} trabajadores y más horas.
          </span>
        </p>
      ) : null}
    </div>
  )
}
