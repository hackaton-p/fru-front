import { TriangleAlert, CircleX, FileSpreadsheet } from "lucide-react"
import Link from "next/link"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { can } from "@/lib/auth/permissions"
import { parametrosDe, type Usuario } from "@/lib/domain"
import type { PlanSemanalData } from "../queries"
import { AlertaPlanificacion } from "./alerta-planificacion"
import { PlanHeader } from "./plan-header"
import { PlanOficialSection } from "./plan-oficial-section"
import { PlanPasos } from "./plan-pasos"
import { ProgramaComercialCard, ProyeccionCosechaCard } from "./proyecciones-cards"
import { CreateOfficialPlan } from "./create-official-plan"
import { planEditable } from "../lib/plan-comparator"
import { PlanningPeriod } from "./planning-period"
import { DiscardPlanButton } from "./discard-plan-button"
import { planningDates } from "@/lib/dates"

interface PlanSemanalViewProps {
  data: PlanSemanalData
  user: Usuario
  readOnly?: boolean
  minimumMonday: string
}

/** Planificador · Plan semanal. */
export function PlanSemanalView({ data, user, readOnly = false, minimumMonday }: PlanSemanalViewProps) {
  const { query, planta, fruta, cosecha, comercial, plan, erroresCarga } = data
  const canGestionar = !readOnly && can(user.rol, "plan:gestionar")
  const cosechaLista = cosecha.length > 0
  const comercialLista = comercial.length > 0
  const dates = planningDates(query)
  const proyeccionesListas = comercialLista && dates.length > 0 && dates.every(date => cosecha.some(day => day.fecha === date))
  const configuracionLista = Boolean(planta.configuradaAt)
  const defaults = parametrosDe(planta)
  const missingProjections = [
    cosechaLista ? null : "la proyección de cosecha",
    comercialLista ? null : "el programa comercial",
  ].filter(Boolean).join(" y ")

  return (
    <>
      {erroresCarga.length > 0 ? (
        <Alert variant="destructive">
          <TriangleAlert aria-hidden />
          <AlertTitle>Algunos datos no pudieron cargarse</AlertTitle>
          <AlertDescription>
            <p>La pantalla sigue disponible para completar los pasos que sí respondieron.</p>
            <ul className="mt-2 list-inside list-disc">
              {erroresCarga.map((error) => <li key={error}>{error}</li>)}
            </ul>
          </AlertDescription>
        </Alert>
      ) : null}
      <PlanHeader
        anio={query.anio}
        semana={query.semana}
        planta={planta}
        fruta={fruta}
        cosecha={cosecha}
        planId={plan?.id ?? null}
        estado={plan?.estado ?? null}
        canGestionar={canGestionar}
        canEnviar={false}
        canCambiarSemana={canGestionar && !plan}
        inicio={query.inicio}
        cantidadDias={query.cantidadDias}
        fechas={query.fechas}
        minimumMonday={minimumMonday}
      />
      <PlanningPeriod key={`${query.inicio}-${query.fechas?.join(",")}`} query={query} locked={Boolean(plan) || readOnly} minimumMonday={minimumMonday} />
      {plan && can(user.rol, "plan:gestionar") && ((plan.estado === "BORRADOR" && !plan.fechaEnvio) || plan.estado === "RECHAZADO") && <div className="self-start"><DiscardPlanButton planId={plan.id} /></div>}
      <PlanPasos
        configuracionLista={configuracionLista}
        cosechaLista={cosechaLista}
        comercialLista={comercialLista}
        planCreado={plan !== null}
      />

      {!configuracionLista ? (
        <Alert>
          <TriangleAlert aria-hidden />
          <AlertTitle>Configura la planta antes de iniciar el plan</AlertTitle>
          <AlertDescription>
            Los valores que ves son sugeridos y no se consideran configuración hasta que se guarden.
            {can(user.rol, "planta:editar")
              ? " Confírmalos o ajústalos en Configuración; puedes guardar los valores sugeridos."
              : " Pide a Subgerencia que los confirme en Configuración."}{" "}
            <Link href="/configuracion" className="font-semibold underline underline-offset-4">
              Ir a Configuración
            </Link>
          </AlertDescription>
        </Alert>
      ) : null}

      {plan?.estado === "RECHAZADO" ? (
        <Alert variant="destructive">
          <CircleX aria-hidden />
          <AlertTitle>El subgerente rechazó el plan</AlertTitle>
          <AlertDescription>
            <p>
              {plan.comentarioAprobacion ?? "Sin comentario."} Revisa la configuración y vuelve a guardar el plan.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {!missingProjections ? (
        <AlertaPlanificacion
          cosechaJabas={cosecha.reduce((s, c) => s + c.jabas, 0)}
          comercialJabas={comercial.reduce((s, c) => s + c.jabas, 0)}
        />
      ) : (
        <Alert>
          <FileSpreadsheet aria-hidden />
          <AlertTitle>Faltan proyecciones para planificar</AlertTitle>
          <AlertDescription>
            <p>
              Falta cargar {missingProjections} para {planta.nombre}, {fruta.nombre}, semana{" "}
              {query.semana} de {query.anio}.
            </p>
            <p>
              {canGestionar
                ? "Importa Excel o completa los formularios de abajo para registrar las proyecciones pendientes."
                : "Solicita al planificador que suba los archivos pendientes."}{" "}
              Podrás crear el plan cuando estén cargadas ambas proyecciones.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <ProgramaComercialCard comercial={comercial} query={query} canImport={canGestionar} />
        <ProyeccionCosechaCard cosecha={cosecha} query={query} canImport={canGestionar} />
      </div>

      {canGestionar && planEditable(plan) ? <CreateOfficialPlan key={`${query.inicio}-${query.cantidadDias}`} query={query} planId={plan?.id} enabled={proyeccionesListas && configuracionLista && erroresCarga.length === 0} /> : null}
      {plan ? <PlanOficialSection plan={plan} defaults={defaults} canEnviar={can(user.rol, "plan:gestionar") && plan.estado === "BORRADOR"} /> : null}
    </>
  )
}
