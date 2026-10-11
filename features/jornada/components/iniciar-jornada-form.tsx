"use client"

import { useState, useTransition } from "react"
import { Play } from "lucide-react"
import { toast } from "sonner"
import { AREA_LABEL } from "@/components/shared/areas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { AreaCodigo, ParametrosPlanta } from "@/lib/domain"
import { formatDecimal, formatHoras, formatInt } from "@/lib/format"
import { cn } from "@/lib/utils"
import { iniciarJornadaAction } from "../actions"
import {
  clasificarHoras,
  horaFin,
  horasConTrabajadores,
  trabajadoresParaHoras,
  type EstadoHoras,
} from "../lib/jornada"
import { ESTADO_HORAS_UI } from "./estado-horas-ui"

interface IniciarJornadaFormProps {
  planId: number
  fecha: string
  meta: number
  /** Horas del plan para el día. */
  horasPlan: number
  horaInicio: string
  parametros: ParametrosPlanta
  areas: { area: AreaCodigo; plan: number }[]
  plantaNombre: string
}

type Valores = Record<AreaCodigo, { llegaron: string; inician: string }>

/** Entero no negativo de un input (vacío o inválido cuenta como 0). */
function aEntero(valor: string): number {
  const n = Number(valor)
  return valor.trim() === "" || !Number.isFinite(n) ? 0 : Math.max(0, Math.floor(n))
}

function signo(n: number) {
  return `${n > 0 ? "+" : n < 0 ? "−" : ""}${formatInt(Math.abs(n))}`
}

function mensajeEstado(estado: EstadoHoras, horas: number, horasPlan: number, p: ParametrosPlanta) {
  if (estado === "EN_PLAN") return "Terminas dentro de las horas del plan."
  if (estado === "HORAS_EXTRA") {
    return `Necesitarás ${formatDecimal(horas - horasPlan)} h más que el plan, dentro de las horas extra permitidas.`
  }
  return `Riesgo de turno extra: pasas las ${formatInt(p.horasJornada + p.horasExtraMax)} h de jornada más horas extra.`
}

const NUMERO = "h-12 w-16 text-right text-lg tabular-nums sm:w-24 md:text-lg"

/** Etapa 1: cuántos llegaron y con cuántos inicia cada área, con el estimado en vivo. */
export function IniciarJornadaForm(props: IniciarJornadaFormProps) {
  const { planId, fecha, meta, horasPlan, horaInicio, parametros: p, areas } = props
  const [valores, setValores] = useState<Valores>(
    () =>
      Object.fromEntries(
        areas.map((a) => [a.area, { llegaron: String(a.plan), inician: String(a.plan) }]),
      ) as Valores,
  )
  const [isPending, startTransition] = useTransition()

  const filas = areas.map((a) => {
    const llegaron = aEntero(valores[a.area].llegaron)
    const inician = aEntero(valores[a.area].inician)
    return { ...a, llegaron, inician, error: inician > llegaron }
  })
  const totalPlan = filas.reduce((s, f) => s + f.plan, 0)
  const totalLlegaron = filas.reduce((s, f) => s + f.llegaron, 0)
  const totalInician = filas.reduce((s, f) => s + f.inician, 0)
  const hayError = filas.some((f) => f.error)
  const enEspera = totalLlegaron - totalInician

  const horas = horasConTrabajadores(meta, totalInician, p)
  const hayEstimado = Number.isFinite(horas)
  const estado = hayEstimado ? clasificarHoras(horas, horasPlan, p) : null
  const ui = estado ? ESTADO_HORAS_UI[estado] : null
  const necesarios = trabajadoresParaHoras(meta, p.horasJornada, p)

  const cambiar = (area: AreaCodigo, campo: "llegaron" | "inician", valor: string) =>
    setValores((v) => ({ ...v, [area]: { ...v[area], [campo]: valor } }))

  const iniciar = () => {
    startTransition(async () => {
      const res = await iniciarJornadaAction({
        planId,
        fecha,
        areas: filas.map((f) => ({ area: f.area, llegaron: f.llegaron, inician: f.inician })),
      })
      if (res.ok) toast.success(`Jornada iniciada con ${formatInt(totalInician)} trabajadores`)
      else toast.error("No se pudo iniciar la jornada", { description: res.error })
    })
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_24rem] lg:items-start">
      <Card>
        <CardHeader>
          <CardTitle className="font-heading text-xl">Iniciar jornada</CardTitle>
          <CardDescription className="max-w-prose text-pretty">
            Registra cuántas personas llegaron y con cuántas arrancas en cada área. El tiempo
            estimado se actualiza mientras escribes.
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Área</TableHead>
                <TableHead className="hidden text-right sm:table-cell">Plan</TableHead>
                <TableHead className="text-right">Llegaron</TableHead>
                <TableHead className="text-right">Inician</TableHead>
                <TableHead className="text-right">
                  <span className="sm:hidden">Dif.</span>
                  <span className="hidden sm:inline">Diferencia vs plan</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filas.map((f) => {
                const dif = f.inician - f.plan
                return (
                  <TableRow key={f.area}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="text-base font-semibold">{AREA_LABEL[f.area]}</span>
                        <span className="text-xs text-muted-foreground tabular-nums sm:hidden">
                          plan {formatInt(f.plan)}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="hidden text-right text-base tabular-nums sm:table-cell">
                      {formatInt(f.plan)}
                    </TableCell>
                    <TableCell className="text-right">
                      <label htmlFor={`llegaron-${f.area}`} className="sr-only">
                        Llegaron a {AREA_LABEL[f.area]}
                      </label>
                      <Input
                        id={`llegaron-${f.area}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        value={valores[f.area].llegaron}
                        onChange={(e) => cambiar(f.area, "llegaron", e.target.value)}
                        className={cn(NUMERO, "ml-auto")}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell className="text-right">
                      <label htmlFor={`inician-${f.area}`} className="sr-only">
                        Inician en {AREA_LABEL[f.area]}
                      </label>
                      <Input
                        id={`inician-${f.area}`}
                        type="number"
                        inputMode="numeric"
                        min={0}
                        step={1}
                        value={valores[f.area].inician}
                        onChange={(e) => cambiar(f.area, "inician", e.target.value)}
                        aria-invalid={f.error || undefined}
                        aria-describedby={f.error ? "inicio-error" : undefined}
                        className={cn(NUMERO, "ml-auto")}
                        disabled={isPending}
                      />
                    </TableCell>
                    <TableCell
                      className={cn(
                        "text-right text-base font-semibold tabular-nums",
                        dif < 0 ? "text-destructive" : "text-success-foreground",
                      )}
                    >
                      {signo(dif)}
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
            <TableFooter>
              <TableRow className="text-base">
                <TableCell className="font-semibold">Total</TableCell>
                <TableCell className="hidden text-right tabular-nums sm:table-cell">
                  {formatInt(totalPlan)}
                </TableCell>
                <TableCell className="pr-4 text-right font-semibold tabular-nums">
                  {formatInt(totalLlegaron)}
                </TableCell>
                <TableCell className="pr-4 text-right font-semibold tabular-nums">
                  {formatInt(totalInician)}
                </TableCell>
                <TableCell
                  className={cn(
                    "text-right font-semibold tabular-nums",
                    totalInician < totalPlan ? "text-destructive" : "text-success-foreground",
                  )}
                >
                  {signo(totalInician - totalPlan)}
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>

          {hayError ? (
            <p id="inicio-error" role="alert" className="text-sm font-medium text-destructive">
              En alguna área inician más personas de las que llegaron. Corrige ese número.
            </p>
          ) : null}
          {enEspera > 0 && !hayError ? (
            <p className="text-sm text-muted-foreground">
              {enEspera === 1
                ? "1 persona llegó pero no inicia"
                : `${formatInt(enEspera)} personas llegaron pero no inician`}{" "}
              (en espera o reubicadas). Puedes sumarlas luego con un cambio de personal.
            </p>
          ) : null}
        </CardContent>
      </Card>

      <aside className="flex flex-col gap-3 lg:sticky lg:top-20">
        <Card>
          <CardContent className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <p className="text-muted-foreground">
                Con {formatInt(totalInician)} trabajadores te tomaría aprox.
              </p>
              <p
                className={cn(
                  "font-heading text-6xl leading-none font-bold tabular-nums",
                  ui?.texto ?? "text-muted-foreground",
                )}
              >
                {hayEstimado ? formatHoras(horas) : "— h"}
              </p>
              <p className="text-muted-foreground">
                {hayEstimado ? (
                  <>
                    Terminarías cerca de las{" "}
                    <strong className="text-foreground">{horaFin(horaInicio, horas)}</strong> ·{" "}
                  </>
                ) : null}
                plan {formatHoras(horasPlan)}
              </p>
            </div>

            <div
              role="status"
              aria-live="polite"
              className={cn(
                "flex items-start gap-2 rounded-lg border px-3 py-2 text-sm font-medium",
                ui?.superficie ?? "bg-muted text-muted-foreground",
              )}
            >
              {ui ? <ui.icon className="mt-0.5 size-4 shrink-0" aria-hidden /> : null}
              <span className={ui ? "text-foreground" : undefined}>
                {estado
                  ? mensajeEstado(estado, horas, horasPlan, p)
                  : "Indica con cuántas personas inicias para ver el estimado."}
              </span>
            </div>

            <p className="text-sm">
              {totalInician >= necesarios
                ? `Tienes el personal para terminar en ${formatInt(p.horasJornada)} h.`
                : `Para terminar en ${formatInt(p.horasJornada)} h necesitas ${formatInt(necesarios)} trabajadores (te faltan ${formatInt(necesarios - totalInician)}).`}
            </p>

            <Button
              size="lg"
              className="h-12 w-full text-base"
              onClick={iniciar}
              disabled={isPending || hayError || totalInician < 1}
            >
              {isPending ? (
                <Spinner data-icon="inline-start" />
              ) : (
                <Play data-icon="inline-start" aria-hidden />
              )}
              Iniciar jornada con {formatInt(totalInician)} trabajadores
            </Button>
          </CardContent>
        </Card>
        <p className="px-1 text-xs text-muted-foreground">
          Estimado = jabas de la meta ÷ (trabajadores × {formatDecimal(p.rendimientoPersonaHora)}{" "}
          jabas por persona-hora × {formatInt(p.factorEficiencia * 100)}% de eficiencia). Parámetros
          del plan de Planta {props.plantaNombre}.
        </p>
      </aside>
    </div>
  )
}
