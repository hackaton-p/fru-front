"use client"

import { useEffect, useState, useTransition } from "react"
import { ChevronDown, Eye, RotateCcw, Save } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Spinner } from "@/components/ui/spinner"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { parametrosDe, type Planta } from "@/lib/domain"
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
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex max-w-3xl flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
            Configuración de planta
          </h1>
          <p className="text-muted-foreground">
            Valores para calcular nuevos planes.
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
        <Alert className="mx-auto w-full max-w-3xl">
          <Eye aria-hidden />
          <AlertTitle>Solo lectura</AlertTitle>
          <AlertDescription>
            Para cambiar estos valores, contacta a la subgerencia.
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
  const [advancedOpen, setAdvancedOpen] = useState(false)
  const [exampleOpen, setExampleOpen] = useState(false)
  const [saveError, setSaveError] = useState<string | null>(null)
  const guardados = parametrosDe(planta)
  const input = borrador ?? toConfigInput(guardados)
  const { values, errors } = parseConfig(input, guardados)
  const cambiados = camposCambiados(input, guardados)
  const n = cambiados.length
  const advancedGroup = GRUPOS[2]
  const advancedErrors = advancedGroup.campos.some((field) => errors[field.key])
  const advancedChanges = advancedGroup.campos.filter((field) => cambiados.includes(field.key)).length

  const setValue = (key: CampoConfig, value: string) => {
    setSaveError(null)
    onBorrador({ ...input, [key]: value })
  }

  function guardar() {
    if (!values) return
    setSaveError(null)
    startTransition(async () => {
      const res = await guardarPlantaAction(planta.id, values)
      if (res.ok) {
        onGuardada(res.data)
        toast.success(`Configuración de Planta ${planta.nombre} guardada`, {
          description: "Se aplicará a los planes que se simulen desde ahora.",
        })
      } else {
        setSaveError(res.error)
        toast.error("No se pudo guardar la configuración", { description: res.error })
      }
    })
  }

  return (
    <form
      noValidate
      className="mx-auto flex w-full max-w-3xl flex-col gap-4"
      onSubmit={(event) => {
        event.preventDefault()
        if (puedeEditar && n > 0 && !pending) guardar()
      }}
    >
      {GRUPOS.slice(0, 2).map((grupo) => (
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
      <Collapsible open={advancedOpen || advancedErrors} onOpenChange={setAdvancedOpen} className="rounded-xl border border-border bg-card">
        <CollapsibleTrigger className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-5 py-3 text-left text-base font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="flex flex-wrap items-center gap-2">
            Eficiencia y alertas
            {advancedErrors ? <span className="text-sm text-destructive">Revisar campos</span> : advancedChanges > 0 ? <span className="text-sm text-warning-foreground">{advancedChanges} cambio{advancedChanges > 1 ? "s" : ""}</span> : null}
          </span>
          <ChevronDown className="size-5 shrink-0 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent>
          <GrupoParametros
            grupo={advancedGroup}
            plantaId={planta.id}
            guardados={guardados}
            compact
            edicion={puedeEditar ? { input, errors, cambiados, disabled: pending, onChange: setValue } : undefined}
          />
        </CollapsibleContent>
      </Collapsible>
      <Collapsible open={exampleOpen} onOpenChange={setExampleOpen} className="rounded-xl border border-border bg-card">
        <CollapsibleTrigger className="group flex min-h-14 w-full items-center justify-between gap-3 rounded-xl px-5 py-3 text-left text-sm font-semibold outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          Ver ejemplo de cálculo
          <ChevronDown className="size-5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" aria-hidden />
        </CollapsibleTrigger>
        <CollapsibleContent className="px-5 pb-5">
          <EjemploCalculoCard
            plantaNombre={planta.nombre}
            dia={ejemplo}
            parametros={values}
            guardados={guardados}
          />
        </CollapsibleContent>
      </Collapsible>
      <p className="px-1 text-sm text-muted-foreground">Los planes guardados no cambian.</p>
      {saveError ? (
        <Alert variant="destructive" role="alert">
          <AlertTitle>No se guardaron los cambios</AlertTitle>
          <AlertDescription>{saveError} Tus cambios siguen aquí; vuelve a intentar guardar.</AlertDescription>
        </Alert>
      ) : null}

      {puedeEditar ? (
        <div className="sticky bottom-4 z-10 flex flex-col gap-3 rounded-xl border border-border bg-card px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
          <p role="status" className="text-sm font-semibold">
            {n > 0 ? (
              <span className="text-warning-foreground">
                {n} cambio{n > 1 ? "s" : ""} sin guardar.
                {!values ? " Corrige los campos marcados para guardar." : ""}
              </span>
            ) : (
              <span className="font-normal text-muted-foreground">Sin cambios pendientes.</span>
            )}
          </p>
          <div className="flex gap-3">
            {n > 0 ? <Button
              type="button"
              variant="outline"
              size="lg"
              className="h-12 flex-1 rounded-full px-5 sm:flex-none"
              disabled={n === 0 || pending}
              onClick={() => {
                setSaveError(null)
                onBorrador(toConfigInput(guardados))
              }}
            >
              <RotateCcw data-icon="inline-start" aria-hidden />
              Descartar
            </Button> : null}
            <Button
              type="submit"
              size="lg"
              className="h-12 flex-1 rounded-full px-6 sm:flex-none"
              disabled={n === 0 || !values || pending}
            >
              {pending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" aria-hidden />}
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </div>
      ) : null}
    </form>
  )
}
