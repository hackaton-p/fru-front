import { TriangleAlert } from "lucide-react"
import { EstadoDiaBadge } from "@/components/shared/estado-badges"
import type { ParametrosPlanta } from "@/lib/domain"
import { formatDia, formatHoras, formatInt, formatMargen } from "@/lib/format"
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
    <div className="flex items-baseline justify-between gap-4 border-t border-background/15 py-2.5 first:border-t-0">
      <dt className="text-sm text-background/80">{label}</dt>
      <dd className="flex items-baseline gap-2 text-right">
        {antes ? (
          <span className="text-sm text-background/70 tabular-nums line-through">{antes}</span>
        ) : null}
        <span className="font-heading text-xl font-bold tabular-nums">{valor}</span>
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
      className="flex flex-col gap-4 rounded-xl bg-foreground p-5 text-background shadow-[0_6px_20px_-8px_rgb(0_0_0/0.35)]"
    >
      <div className="flex flex-col gap-1">
        <h2 id="ejemplo-calculo" className="font-heading text-xl font-bold">
          Así calcula el sistema
        </h2>
        {dia ? (
          <p className="text-sm text-background/80">
            Ejemplo con el día pico de la semana {dia.semana} en Planta {plantaNombre}:{" "}
            <strong className="text-background">{formatDia(dia.fecha)}</strong>,{" "}
            <strong className="text-background tabular-nums">{formatInt(dia.jabas)} jabas</strong>.
          </p>
        ) : null}
      </div>

      {!dia ? (
        <p className="text-sm text-background/80">
          Aún no hay proyección de cosecha para la próxima semana; el ejemplo aparece cuando se
          importe.
        </p>
      ) : !parametros ? (
        <p role="status" className="text-sm text-background/80">
          Corrige los campos marcados para ver el cálculo.
        </p>
      ) : (
        <Resultado dia={dia} parametros={parametros} guardados={guardados} />
      )}

      <p className="text-xs leading-relaxed text-background/75">
        Trabajadores = jabas ÷ (rendimiento × eficiencia × horas de jornada). El margen es la fruta
        adicional que entra en la jornada más las horas extra permitidas.
      </p>
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

  const porPersona = formatInt(r.jabasPorPersona)
  const trabajadores = formatInt(r.trabajadores)
  const horas = formatHoras(r.horas)
  const margen = formatMargen(r.margen)

  return (
    <div aria-live="polite" className="flex flex-col gap-3">
      <dl className="flex flex-col">
        <Fila
          label="Jabas por persona por jornada"
          valor={porPersona}
          antes={si(porPersona, formatInt(g.jabasPorPersona))}
        />
        <Fila
          label="Trabajadores necesarios"
          valor={trabajadores}
          antes={si(trabajadores, formatInt(g.trabajadores))}
        />
        <Fila label="Horas con ese personal" valor={horas} antes={si(horas, formatHoras(g.horas))} />
        <Fila
          label="Margen para volumen extra"
          valor={margen}
          antes={si(margen, formatMargen(g.margen))}
        />
      </dl>
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-background/80">Ese día quedaría:</span>
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
