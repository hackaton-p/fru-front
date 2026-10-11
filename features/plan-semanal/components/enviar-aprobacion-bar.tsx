import { Send } from "lucide-react"
import type { EstadoPlan } from "@/lib/domain"
import { EnviarAprobacionButton } from "./enviar-aprobacion-button"

interface EnviarAprobacionBarProps {
  planId: number | null
  estado: EstadoPlan | null
}

function motivo(planId: number | null, estado: EstadoPlan | null) {
  if (planId === null) return "Completa el programa comercial y la proyección de cosecha para generar el plan."
  if (estado === "PENDIENTE") return "El plan ya fue enviado y espera la decisión de Subgerencia."
  if (estado === "BORRADOR") return "Revisa la planificación generada y envíala a Subgerencia."
  if (estado === "RECHAZADO") return "Subgerencia rechazó el plan. Ajusta los datos para poder enviarlo de nuevo."
  return "Este plan ya no puede enviarse a aprobación."
}

/** Barra fija: el envío a aprobación siempre está a la vista, activa solo con un borrador. */
export function EnviarAprobacionBar({ planId, estado }: EnviarAprobacionBarProps) {
  return (
    <div className="sticky bottom-4 z-30 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background/95 px-4 py-3 shadow-lg backdrop-blur supports-backdrop-filter:bg-background/80">
      <p className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"><Send className="size-4 shrink-0" aria-hidden />{motivo(planId, estado)}</p>
      <EnviarAprobacionButton planId={planId} disabled={planId === null || estado !== "BORRADOR"} />
    </div>
  )
}
