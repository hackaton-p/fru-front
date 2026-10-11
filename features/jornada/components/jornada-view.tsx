import { CalendarX, HardHat } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { capitalize, formatDiaLargo, formatHoras, formatInt } from "@/lib/format"
import { horaDe, horaSugerida } from "../lib/jornada"
import type { JornadaData } from "../queries"
import { CerrarJornadaForm } from "./cerrar-jornada-form"
import { CierreResultado } from "./cierre-resultado"
import { EstadoJornada } from "./estado-jornada"
import { EtapasJornada } from "./etapas-jornada"
import { IniciarJornadaForm } from "./iniciar-jornada-form"
import { PersonalAreasTable } from "./personal-areas-table"
import { RegistroForm } from "./registro-form"
import { RegistrosList } from "./registros-list"
import { ReiniciarDemoButton } from "./reiniciar-demo-button"

/** Se muestra cuando otro rol entra a la pantalla del jefe de turno. */
export function SoloJefeTurno() {
  return (
    <Empty className="flex-none border border-dashed py-10">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <HardHat />
        </EmptyMedia>
        <EmptyTitle className="font-heading text-xl">Esta pantalla es del jefe de turno</EmptyTitle>
        <EmptyDescription>
          Aquí se inicia, registra y cierra la jornada. Elige «Jefe de turno» en «Ver como» para
          verla.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

/** Jefe de turno · Jornada: iniciar, registrar durante la jornada y cerrar. */
export function JornadaView({ data }: { data: JornadaData }) {
  const { planta, actual, demo } = data

  if (!actual) {
    return (
      <Empty className="flex-none border border-dashed py-10">
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <CalendarX />
          </EmptyMedia>
          <EmptyTitle className="font-heading text-xl">No hay una jornada programada</EmptyTitle>
          <EmptyDescription>
            Cuando el subgerente apruebe el plan de la semana de Planta {planta.nombre}, aquí
            aparecerá el día que toca ejecutar.
          </EmptyDescription>
        </EmptyHeader>
      </Empty>
    )
  }

  const { plan, dia, jornada } = actual
  const p = plan.parametrosUsados
  const etapa = !jornada ? 0 : jornada.estado === "ABIERTA" ? 1 : 2
  const inicioProgramado = jornada ? horaDe(jornada.horaInicio) : p.horaInicio.slice(0, 5)

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
            Jornada · <span className="text-primary">{capitalize(formatDiaLargo(dia.fecha))}</span>
          </h1>
          <p className="text-muted-foreground">
            Planta {planta.nombre} · Inicio programado {inicioProgramado} · Meta{" "}
            {formatInt(dia.jabasMeta)} jabas · Plan: {formatInt(dia.trabajadores)} trabajadores en{" "}
            {formatHoras(dia.horas)}
          </p>
        </div>
        <EtapasJornada actual={etapa} />
      </div>

      {!jornada ? (
        <IniciarJornadaForm
          planId={plan.id}
          fecha={dia.fecha}
          meta={dia.jabasMeta}
          horasPlan={dia.horas}
          horaInicio={inicioProgramado}
          parametros={p}
          areas={dia.areas.map((a) => ({ area: a.area, plan: a.trabajadoresPlan }))}
          plantaNombre={planta.nombre}
        />
      ) : jornada.estado === "ABIERTA" ? (
        <>
          <EstadoJornada jornada={jornada} dia={dia} parametros={p} />
          <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 lg:items-start">
            <RegistroForm
              jornadaId={jornada.id}
              horaSugerida={horaSugerida(jornada)}
              ultimoAvance={(() => {
                const a = jornada.registros.findLast((r) => r.tipo === "AVANCE")
                return a?.tipo === "AVANCE"
                  ? { recibidas: a.jabasRecibidasAcum, procesadas: a.jabasProcesadasAcum }
                  : null
              })()}
              meta={dia.jabasMeta}
            />
            <RegistrosList jornada={jornada} dia={dia} parametros={p} />
          </div>
          <PersonalAreasTable jornada={jornada} />
          <CerrarJornadaForm
            jornadaId={jornada.id}
            horasSugeridas={jornada.estimacion.horasEstimadas}
            jabasSugeridas={jornada.estimacion.volumenDia}
          />
          {demo ? (
            <div>
              <ReiniciarDemoButton />
            </div>
          ) : null}
        </>
      ) : (
        <CierreResultado jornada={jornada} dia={dia} parametros={p}>
          {demo ? <ReiniciarDemoButton /> : null}
        </CierreResultado>
      )}
    </>
  )
}
