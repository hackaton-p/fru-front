import { ESTADOS_PLAN, type EstadoPlan } from "@/lib/domain"

/** El subgerente ve todo lo enviado; el borrador sigue siendo del planificador. */
export const ESTADOS_SUBGERENTE: readonly EstadoPlan[] = ESTADOS_PLAN.filter(
  (e) => e !== "BORRADOR",
)

/** Filtros de la lista de planes (contexto §5), en orden de pantalla. */
export const FILTROS_ESTADO: { estado: EstadoPlan | null; label: string }[] = [
  { estado: null, label: "Todos" },
  { estado: "PENDIENTE", label: "Por aprobar" },
  { estado: "EN_EJECUCION", label: "En ejecución" },
  { estado: "APROBADO", label: "Aprobados" },
  { estado: "RECHAZADO", label: "Rechazados" },
  { estado: "CERRADO", label: "Cerrados" },
]

export function parseFiltroEstado(value: unknown): EstadoPlan | null {
  return typeof value === "string" && (ESTADOS_SUBGERENTE as readonly string[]).includes(value)
    ? (value as EstadoPlan)
    : null
}
