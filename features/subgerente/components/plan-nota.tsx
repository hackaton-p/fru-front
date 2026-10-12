import { LocalDateTime } from "@/features/plan-semanal/components/local-date-time"
import type { Plan } from "@/lib/domain"

/** Cuándo se envió o decidió el plan, según su estado. */
export function PlanNota({ plan }: { plan: Plan }) {
  const aprobado = plan.fechaAprobacion ? <LocalDateTime iso={plan.fechaAprobacion} /> : null
  const enviado = plan.fechaEnvio ? <LocalDateTime iso={plan.fechaEnvio} /> : null

  switch (plan.estado) {
    case "PENDIENTE":
      return enviado ? <>Enviado {enviado}</> : <>Enviado a aprobación</>
    case "APROBADO":
      return aprobado ? <>Aprobado {aprobado}</> : <>Aprobado</>
    case "EN_EJECUCION": {
      // El plan pasa a cerrado recién cuando se cierran las jornadas de todos sus días.
      const avance =
        plan.diasCerrados != null ? ` · ${plan.diasCerrados} de ${plan.dias.length} días cerrados` : ""
      return aprobado ? (
        <>
          En curso{avance} · aprobado {aprobado}
        </>
      ) : (
        <>En curso{avance}</>
      )
    }
    case "RECHAZADO":
      return aprobado ? <>Devuelto {aprobado}</> : <>Devuelto al planificador</>
    case "CERRADO":
      return aprobado ? <>Semana cerrada · aprobado {aprobado}</> : <>Semana cerrada</>
    default:
      return null
  }
}
