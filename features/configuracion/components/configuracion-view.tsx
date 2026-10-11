"use client"

import { useEffect, useState, useTransition } from "react"
import { Eye, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parametrosDe, type Planta } from "@/lib/domain"
import { LocalDateTime } from "@/features/plan-semanal/components/local-date-time"
import { guardarPlantaAction } from "../actions"
import {
  camposCambiados,
  GRUPOS,
  parseConfig,
  toConfigInput,
  type CampoConfig,
  type ConfigInput,
} from "../lib/configuracion"
import type { ConfiguracionData } from "../queries"
import { EjemploCalculoCard } from "./ejemplo-calculo-card"
import { GrupoParametros } from "./grupo-parametros"
import { QuienUsaCard } from "./quien-usa-card"

/** Configuración de planta: valores por defecto con que el sistema propone el plan. */
export function ConfiguracionView({ data }: { data: ConfiguracionData }) {
  const [plantaId, setPlantaId] = useState(String(data.plantaInicial))
  // Lo devuelto al guardar, hasta que llegan las props revalidadas.
  const [guardadas, setGuardadas] = useState<Record<number, Planta>>({})
  // Borradores por planta: cambiar de pestaña no pierde lo escrito.
  const [borradores, setBorradores] = useState<Record<number, ConfigInput>>({})

  const plantas = data.plantas.map((p) => guardadas[p.id] ?? p)
  const pendientes = plantas.filter(
    (p) => borradores[p.id] && camposCambiados(borradores[p.id], parametrosDe(p)).length > 0,
  )
  const hayPendientes = pendientes.length > 0

  // Avisa antes de salir de la página con cambios sin guardar.
  useEffect(() => {
    if (!hayPendientes) return
    const avisar = (e: BeforeUnloadEvent) => e.preventDefault()
    window.addEventListener("beforeunload", avisar)
    return () => window.removeEventListener("beforeunload", avisar)
  }, [hayPendientes])

  return (
    <Tabs value={plantaId} onValueChange={setPlantaId} className="gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
            Configuración de planta
          </h1>
          <p className="text-muted-foreground">
            Valores por defecto con los que el sistema propone trabajadores, horas y alertas. El
            planificador puede cambiarlos en cada plan; el plan guarda los valores finales que usó.
          </p>
        </div>
        <TabsList aria-label="Planta" className="h-auto flex-wrap justify-start gap-2 bg-transparent p-0 group-data-horizontal/tabs:h-auto">
          {plantas.map((p) => (
            <TabsTrigger
              key={p.id}
              value={String(p.id)}
              className="h-11 flex-none rounded-full border-border bg-card px-5 text-base font-bold text-foreground data-active:border-foreground data-active:bg-foreground data-active:text-background data-active:shadow-none dark:data-active:bg-foreground dark:data-active:text-background"
            >
              Planta {p.nombre}
              {pendientes.some((x) => x.id === p.id) ? (
                <span className="size-2 rounded-full bg-chart-2" aria-label="con cambios sin guardar" />
              ) : null}
            </TabsTrigger>
          ))}
        </TabsList>
      </div>

      {!data.puedeEditar ? (
        <Alert>
          <Eye aria-hidden />
          <AlertTitle>Solo lectura</AlertTitle>
          <AlertDescription>
            Estos valores los cambia la subgerencia. Si alguno ya no refleja la planta, coordínalo
            con ella.
          </AlertDescription>
        </Alert>
      ) : null}

      {plantas.map((p) => (
        <TabsContent key={p.id} value={String(p.id)} className="text-base">
          <PlantaPanel
            planta={p}
            ejemplo={data.ejemplos[p.id] ?? null}
            puedeEditar={data.puedeEditar}
            borrador={borradores[p.id]}
            onBorrador={(input) => setBorradores((b) => ({ ...b, [p.id]: input }))}
            onGuardada={(planta) => {
              setGuardadas((g) => ({ ...g, [planta.id]: planta }))
              setBorradores((b) => ({ ...b, [planta.id]: toConfigInput(parametrosDe(planta)) }))
            }}
          />
        </TabsContent>
      ))}
    </Tabs>
  )
}

interface PlantaPanelProps {
  planta: Planta
  ejemplo: ConfiguracionData["ejemplos"][number]
  puedeEditar: boolean
  borrador: ConfigInput | undefined
  onBorrador: (input: ConfigInput) => void
  onGuardada: (planta: Planta) => void
}

function PlantaPanel({
  planta,
  ejemplo,
  puedeEditar,
  borrador,
  onBorrador,
  onGuardada,
}: PlantaPanelProps) {
  const [pending, startTransition] = useTransition()
  const guardados = parametrosDe(planta)
  const input = borrador ?? toConfigInput(guardados)
  const { values, errors } = parseConfig(input, guardados)
  const cambiados = camposCambiados(input, guardados)
  const n = cambiados.length

  const setValue = (key: CampoConfig, value: string) => onBorrador({ ...input, [key]: value })

  function guardar() {
    if (!values) return
    startTransition(async () => {
      const res = await guardarPlantaAction(planta.id, values)
      if (res.ok) {
        onGuardada(res.data)
        toast.success(`Configuración de Planta ${planta.nombre} guardada`, {
          description: "Se aplicará a los planes que se simulen desde ahora.",
        })
      } else {
        toast.error("No se pudo guardar la configuración", { description: res.error })
      }
    })
  }

  return (
    <div className="flex flex-col gap-6">
      {!planta.configuradaAt ? (
        <Alert>
          <AlertTitle>Configuración pendiente</AlertTitle>
          <AlertDescription>
            Revisa los valores sugeridos y guárdalos para habilitar la planificación de esta planta.
            Puedes guardar los valores sugeridos tal como están.
          </AlertDescription>
        </Alert>
      ) : null}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_23rem] lg:items-start">
        <div className="flex flex-col gap-6">
          {GRUPOS.map((grupo) => (
            <GrupoParametros
              key={grupo.titulo}
              grupo={grupo}
              plantaId={planta.id}
              guardados={guardados}
              edicion={
                puedeEditar
                  ? { input, errors, cambiados, disabled: pending, onChange: setValue }
                  : undefined
              }
            />
          ))}
        </div>
        <aside className="flex flex-col gap-6 lg:sticky lg:top-6">
          <EjemploCalculoCard
            plantaNombre={planta.nombre}
            dia={ejemplo}
            parametros={values}
            guardados={guardados}
          />
          <QuienUsaCard />
        </aside>
      </div>

      {puedeEditar ? (
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl bg-card px-5 py-4 shadow-[0_8px_24px_-6px_rgb(0_0_0/0.18)] ring-1 ring-foreground/10 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-sm font-semibold">
            {n > 0 ? (
              <span className="text-warning-foreground">
                {n} cambio{n > 1 ? "s" : ""} sin guardar en Planta {planta.nombre}.
                {!values ? " Corrige los campos marcados para guardar." : ""}
              </span>
            ) : !planta.configuradaAt ? (
              <span className="font-normal text-warning-foreground">
                Configuración pendiente · confirma los valores sugeridos para habilitar planes.
              </span>
            ) : planta.updatedAt ? (
              <span className="font-normal text-muted-foreground">
                Sin cambios · Última modificación <LocalDateTime iso={planta.updatedAt} />
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">Sin cambios.</span>
            )}
          </p>
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 flex-1 rounded-full px-5 sm:flex-none"
              disabled={n === 0 || pending}
              onClick={() => onBorrador(toConfigInput(guardados))}
            >
              <RotateCcw data-icon="inline-start" aria-hidden />
              Descartar
            </Button>
            <Button
              type="button"
              size="lg"
              className="h-12 flex-1 rounded-full px-6 sm:flex-none"
              disabled={(n === 0 && Boolean(planta.configuradaAt)) || !values || pending}
              onClick={guardar}
            >
              {pending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" aria-hidden />}
              {pending ? "Guardando…" : planta.configuradaAt ? "Guardar cambios" : "Guardar configuración"}
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  )
}
