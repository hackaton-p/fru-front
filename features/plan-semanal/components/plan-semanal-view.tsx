import { CircleX, FileSpreadsheet } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { can } from "@/lib/auth/permissions"
import { parametrosDe, type Usuario } from "@/lib/domain"
import type { PlanSemanalData } from "../queries"
import { AlertaPlanificacion } from "./alerta-planificacion"
import { PlanHeader } from "./plan-header"
import { PlanOficialSection } from "./plan-oficial-section"
import { PlanPasos } from "./plan-pasos"
import { ProgramaComercialCard, ProyeccionCosechaCard } from "./proyecciones-cards"
import { SimulacionSection } from "./simulacion/simulacion-section"

interface PlanSemanalViewProps {
  data: PlanSemanalData
  user: Usuario
}

/** Planificador · Plan semanal. */
export function PlanSemanalView({ data, user }: PlanSemanalViewProps) {
  const { query, planta, fruta, cosecha, comercial, plan, simulacionInicial } = data
  const canGestionar = can(user.rol, "plan:gestionar")
  const defaults = parametrosDe(planta)
  const missingProjections = [
    cosecha.length === 0 ? "la proyección de cosecha" : null,
    comercial.length === 0 ? "el programa comercial" : null,
  ].filter(Boolean).join(" y ")

  return (
    <>
      <PlanHeader
        semana={query.semana}
        planta={planta}
        fruta={fruta}
        cosecha={cosecha}
        planId={plan?.id ?? null}
        estado={plan?.estado ?? null}
        canGestionar={canGestionar}
      />
      <PlanPasos />

      {plan?.estado === "RECHAZADO" ? (
        <Alert variant="destructive">
          <CircleX aria-hidden />
          <AlertTitle>El subgerente rechazó el plan</AlertTitle>
          <AlertDescription>
            <p>
              {plan.comentarioAprobacion ?? "Sin comentario."} Ajusta la simulación y vuelve a
              aplicarla.
            </p>
          </AlertDescription>
        </Alert>
      ) : null}

      {missingProjections ? (
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
                ? "Usa los botones Importar Excel de las tarjetas de abajo para subir los archivos pendientes."
                : "Solicita al planificador que suba los archivos pendientes."}{" "}
              La simulación estará disponible cuando estén cargadas ambas proyecciones.
            </p>
          </AlertDescription>
        </Alert>
      ) : (
        <AlertaPlanificacion
          cosechaJabas={cosecha.reduce((s, c) => s + c.jabas, 0)}
          comercialJabas={comercial.reduce((s, c) => s + c.jabas, 0)}
        />
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProyeccionCosechaCard cosecha={cosecha} query={query} canImport={canGestionar} />
        <ProgramaComercialCard comercial={comercial} query={query} canImport={canGestionar} />
      </div>

      {simulacionInicial && !missingProjections ? (
        <SimulacionSection
          query={query}
          planta={planta}
          defaults={defaults}
          plan={plan}
          initial={simulacionInicial}
          canGestionar={canGestionar}
        />
      ) : null}
      <PlanOficialSection plan={plan} defaults={defaults} />
    </>
  )
}
