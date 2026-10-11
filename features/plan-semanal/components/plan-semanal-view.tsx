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
import { SimulacionSection } from "./simulacion/simulacion-section"

interface PlanSemanalViewProps {
  data: PlanSemanalData
  user: Usuario
}

/** Planificador · Plan semanal. */
export function PlanSemanalView({ data, user }: PlanSemanalViewProps) {
  const { query, planta, fruta, cosecha, comercial, plan, erroresCarga, simulacionInicial } = data
  const canGestionar = can(user.rol, "plan:gestionar")
  const cosechaLista = cosecha.length > 0
  const comercialLista = comercial.length > 0
  const proyeccionesListas = cosechaLista && comercialLista
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
      />
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
              {plan.comentarioAprobacion ?? "Sin comentario."} Ajusta la simulación y vuelve a
              aplicarla.
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
                ? "Usa los botones Importar Excel de las tarjetas de abajo para subir los archivos pendientes."
                : "Solicita al planificador que suba los archivos pendientes."}{" "}
              La simulación estará disponible cuando estén cargadas ambas proyecciones.
            </p>
          </AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <ProyeccionCosechaCard cosecha={cosecha} query={query} canImport={canGestionar} />
        <ProgramaComercialCard comercial={comercial} query={query} canImport={canGestionar} />
      </div>

      {proyeccionesListas ? (
        <SimulacionSection
          query={query}
          planta={planta}
          defaults={defaults}
          plan={plan}
          initial={simulacionInicial}
          canGestionar={canGestionar}
          proyeccionesListas={proyeccionesListas}
          configuracionLista={configuracionLista}
        />
      ) : null}
      <PlanOficialSection plan={plan} defaults={defaults} />
    </>
  )
}
