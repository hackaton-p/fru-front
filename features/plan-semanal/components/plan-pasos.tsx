import { Check } from "lucide-react"
import { cn } from "@/lib/utils"

interface PlanPasosProps {
  configuracionLista: boolean
  cosechaLista: boolean
  comercialLista: boolean
  planCreado: boolean
}

/** Flujo para iniciar un plan semanal a partir de sus proyecciones. */
export function PlanPasos({ configuracionLista, cosechaLista, comercialLista, planCreado }: PlanPasosProps) {
  const pasos = [
    {
      titulo: "Configurar planta",
      detalle: configuracionLista
        ? "Parámetros confirmados"
        : "Revisa los valores sugeridos en Configuración",
      listo: configuracionLista,
    },
    {
      titulo: "Cargar programa comercial",
      detalle: comercialLista ? "Programa comercial registrado" : "Importa Excel o agrega registros por cliente",
      listo: comercialLista,
    },
    {
      titulo: "Cargar proyección de cosecha",
      detalle: cosechaLista ? "Proyección de cosecha registrada" : "Importa Excel o distribuye el total entre los días",
      listo: cosechaLista,
    },
    {
      titulo: "Crear plan oficial",
      detalle: planCreado
        ? "Plan listo; puedes enviarlo a aprobación"
        : "Crea el plan con los parámetros de la planta y envíalo a aprobación",
      listo: planCreado,
    },
  ]

  return (
    <nav aria-label="Flujo para crear el plan semanal" className="sticky top-14 z-30 -mx-2 rounded-xl border bg-background/95 px-4 py-3 shadow-sm backdrop-blur supports-backdrop-filter:bg-background/80">
      <ol className="grid grid-cols-4">
        {pasos.map((paso, i) => (
          <li key={paso.titulo} className="min-w-0" aria-current={!paso.listo && pasos.slice(0, i).every((p) => p.listo) ? "step" : undefined}>
            <div className="flex items-center gap-2">
              <span className={cn(
                "flex size-8 shrink-0 items-center justify-center rounded-full text-sm font-semibold tabular-nums",
                paso.listo ? "bg-primary text-primary-foreground" : "border bg-muted text-muted-foreground",
              )}>
                {paso.listo ? <Check className="size-4" aria-label="Completado" /> : i + 1}
              </span>
              {i < pasos.length - 1 && (
                <span aria-hidden className={cn("h-0.5 flex-1 rounded-full", paso.listo ? "bg-primary" : "bg-border")} />
              )}
            </div>
            <p className="mt-2 pr-2 text-sm font-medium leading-tight">{paso.titulo}</p>
            <p className="mt-0.5 hidden pr-3 text-xs text-muted-foreground lg:block">{paso.detalle}</p>
          </li>
        ))}
      </ol>
    </nav>
  )
}
