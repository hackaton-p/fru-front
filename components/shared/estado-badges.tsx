import {
  CircleCheck,
  CircleDashed,
  CircleX,
  Clock,
  Lock,
  OctagonAlert,
  Play,
  TriangleAlert,
  type LucideIcon,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import type { EstadoDia, EstadoPlan } from "@/lib/domain"

/*
 * Estados del plan y del día (contexto §6) con Badge de shadcn e ícono, nunca
 * solo color. Los tonos usan tokens del tema (app/theme.css):
 * success = verde, warning = ámbar, destructive = coral.
 */

type BadgeVariant = "default" | "secondary" | "destructive" | "outline"

interface EstadoUi {
  label: string
  variant: BadgeVariant
  icon: LucideIcon
  /** Tono semántico del tema para estados sin variante propia en Badge. */
  className?: string
}

const SUCCESS = "bg-success text-success-foreground"
const WARNING = "bg-warning text-warning-foreground"
const OSCURO = "bg-foreground text-background"

export const ESTADO_PLAN_UI: Record<EstadoPlan, EstadoUi> = {
  BORRADOR: { label: "Plan oficial guardado", variant: "default", icon: CircleCheck, className: SUCCESS },
  PENDIENTE: { label: "Pendiente de aprobación", variant: "default", icon: Clock, className: WARNING },
  APROBADO: { label: "Aprobado", variant: "default", icon: CircleCheck, className: SUCCESS },
  RECHAZADO: { label: "Rechazado", variant: "destructive", icon: CircleX },
  EN_EJECUCION: { label: "En ejecución", variant: "default", icon: Play, className: OSCURO },
  CERRADO: { label: "Cerrado", variant: "secondary", icon: Lock },
}

const SIN_PLAN: EstadoUi = { label: "Sin plan oficial", variant: "outline", icon: CircleDashed }

export const ESTADO_DIA_UI: Record<EstadoDia, EstadoUi> = {
  DENTRO_JORNADA: { label: "Dentro de jornada", variant: "default", icon: CircleCheck, className: SUCCESS },
  HORAS_EXTRA: { label: "Requiere horas extra", variant: "default", icon: Clock, className: WARNING },
  MARGEN_BAJO: { label: "Margen bajo", variant: "default", icon: TriangleAlert, className: WARNING },
  RIESGO_TURNO_EXTRA: { label: "Riesgo de turno extra", variant: "destructive", icon: OctagonAlert },
}

function EstadoBadge({ ui }: { ui: EstadoUi }) {
  const Icon = ui.icon
  return (
    <Badge variant={ui.variant} className={ui.className}>
      <Icon data-icon="inline-start" aria-hidden />
      {ui.label}
    </Badge>
  )
}

export function EstadoPlanBadge({ estado }: { estado: EstadoPlan | null }) {
  return <EstadoBadge ui={estado ? ESTADO_PLAN_UI[estado] : SIN_PLAN} />
}

export function EstadoDiaBadge({ estado }: { estado: EstadoDia }) {
  return <EstadoBadge ui={ESTADO_DIA_UI[estado]} />
}
