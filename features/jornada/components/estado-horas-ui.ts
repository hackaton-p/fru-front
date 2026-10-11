import { CircleCheck, Clock, OctagonAlert, type LucideIcon } from "lucide-react"
import type { MotivoAjuste } from "@/lib/domain"
import type { EstadoHoras } from "../lib/jornada"

/*
 * Estado de las horas de la jornada con los tonos del tema: verde dentro del
 * plan, ámbar con horas extra, coral con riesgo de turno extra. Siempre con
 * ícono y título, nunca solo color.
 */

interface EstadoHorasUi {
  titulo: string
  icon: LucideIcon
  /** Color del número de horas. */
  texto: string
  /** Fondo, borde y texto del aviso (el texto de cuerpo va en tinta oscura). */
  superficie: string
}

export const ESTADO_HORAS_UI: Record<EstadoHoras, EstadoHorasUi> = {
  EN_PLAN: {
    titulo: "En plan",
    icon: CircleCheck,
    texto: "text-primary",
    superficie: "border-success-foreground/25 bg-success text-success-foreground",
  },
  HORAS_EXTRA: {
    titulo: "No se termina en las horas del plan",
    icon: Clock,
    texto: "text-warning-foreground",
    superficie: "border-chart-2 bg-warning text-warning-foreground",
  },
  RIESGO_TURNO_EXTRA: {
    titulo: "Riesgo de turno extra",
    icon: OctagonAlert,
    texto: "text-destructive",
    superficie: "border-destructive/40 bg-destructive/10 text-destructive",
  },
}

export const MOTIVO_LABEL: Record<MotivoAjuste, string> = {
  CAMBIO_VOLUMEN: "Cambio de volumen",
  PERSONAL_PRESENTE: "Personal presente",
}
