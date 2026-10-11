import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

const ETAPAS = ["Iniciar jornada", "Durante la jornada", "Cierre"] as const

/**
 * Las tres etapas de la jornada; la actual en píldora oscura. En el celular
 * solo la actual muestra su nombre, para que las tres quepan en una fila.
 */
export function EtapasJornada({ actual }: { actual: 0 | 1 | 2 }) {
  return (
    <ol aria-label="Etapas de la jornada" className="flex gap-2">
      {ETAPAS.map((label, i) => {
        const hecha = i < actual
        const enCurso = i === actual
        return (
          <li
            key={label}
            aria-current={enCurso ? "step" : undefined}
            className={cn(
              "flex h-11 shrink-0 items-center gap-2 rounded-full border bg-card px-2 text-sm font-semibold sm:pr-4",
              enCurso && "border-foreground bg-foreground pr-4 text-background",
              !enCurso && !hecha && "text-muted-foreground",
            )}
          >
            <span
              className={cn(
                "flex size-7 items-center justify-center rounded-full text-xs tabular-nums",
                enCurso || hecha
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
              )}
            >
              {hecha ? <Check className="size-4" aria-hidden /> : i + 1}
            </span>
            <span className={cn(!enCurso && "sr-only sm:not-sr-only")}>{label}</span>
            {hecha ? <span className="sr-only"> (completada)</span> : null}
          </li>
        )
      })}
    </ol>
  )
}
