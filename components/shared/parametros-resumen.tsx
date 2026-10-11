import { Badge } from "@/components/ui/badge"
import type { ParametrosPlanta } from "@/lib/domain"
import { PARAMETROS, parametrosDistintos } from "@/lib/parametros"

interface ParametrosResumenProps {
  /** Valores finales usados (o simulados) en el plan. */
  valores: ParametrosPlanta
  /** Valores por defecto de la planta, para marcar lo que cambió. */
  defaults: ParametrosPlanta
}

/**
 * Lista de parámetros de un plan. Si un valor difiere del default de la planta
 * se resalta y se muestra "(default X)" al lado.
 */
export function ParametrosResumen({ valores, defaults }: ParametrosResumenProps) {
  const distintos = parametrosDistintos(valores, defaults)
  return (
    <ul className="flex flex-wrap gap-2" aria-label="Parámetros del plan">
      {PARAMETROS.map((def) => {
        const cambiado = distintos.includes(def.key)
        return (
          <li key={def.key}>
            <Badge
              variant="outline"
              className={cambiado ? "border-chart-2 bg-warning text-warning-foreground" : undefined}
            >
              {def.shortLabel}: {def.format(valores[def.key])}
              {cambiado ? ` (default ${def.format(defaults[def.key])})` : null}
            </Badge>
          </li>
        )
      })}
    </ul>
  )
}

/** "1 valor cambiado respecto al default" / "valores por defecto de la planta". */
export function describirCambios(valores: ParametrosPlanta, defaults: ParametrosPlanta): string {
  const n = parametrosDistintos(valores, defaults).length
  if (n === 0) return "valores por defecto de la planta"
  return `${n} valor${n > 1 ? "es" : ""} cambiado${n > 1 ? "s" : ""} respecto al default`
}
