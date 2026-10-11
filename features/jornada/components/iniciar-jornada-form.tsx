"use client"

import { useState, useTransition } from "react"
import { Play } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { jabasATon, KG_POR_JABA, tonAJabas, type ParametrosPlanta } from "@/lib/domain"
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
  /** Trabajadores del plan para el día. */
  trabajadoresPlan: number
  horaInicio: string
  parametros: ParametrosPlanta
  plantaNombre: string
}

/** Número no negativo de un input (vacío o inválido cuenta como 0). */
function aNumero(valor: string): number {
  const n = Number(valor)
  return valor.trim() === "" || !Number.isFinite(n) ? 0 : Math.max(0, n)
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

const NUMERO = "h-14 text-right text-2xl font-semibold tabular-nums md:text-2xl"

/** Etapa 1: toneladas que se tienen y trabajadores con los que se inicia, con el estimado en vivo. */
export function IniciarJornadaForm(props: IniciarJornadaFormProps) {
  const { planId, fecha, meta, horasPlan, trabajadoresPlan, horaInicio, parametros: p } = props
  // Valor propuesto en el input (con un decimal, sin separador de miles).
  const tonPropuestas = String(Math.round(jabasATon(meta) * 10) / 10)
  const [toneladas, setToneladas] = useState(tonPropuestas)
  const [trabajadoresTxt, setTrabajadoresTxt] = useState(String(trabajadoresPlan))
  const [isPending, startTransition] = useTransition()

  // Sin cambiar las toneladas propuestas, el volumen es exactamente la meta.
  const jabasDia = toneladas === tonPropuestas ? meta : tonAJabas(aNumero(toneladas))
  const totalInician = Math.floor(aNumero(trabajadoresTxt))
  const sinFruta = jabasDia < 1
  const difJabas = jabasDia - meta

  const horas = horasConTrabajadores(jabasDia, totalInician, p)
  const hayEstimado = Number.isFinite(horas) && !sinFruta
  const estado = hayEstimado ? clasificarHoras(horas, horasPlan, p) : null
  const ui = estado ? ESTADO_HORAS_UI[estado] : null
  const necesarios = trabajadoresParaHoras(jabasDia, p.horasJornada, p)

  const iniciar = () => {
    startTransition(async () => {
      const res = await iniciarJornadaAction({ planId, fecha, trabajadores: totalInician, jabasDia })
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
            Indica la fruta que tienes y con cuántas personas arrancas. El tiempo estimado se
            actualiza mientras escribes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-6 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="inicio-toneladas">Toneladas que tienes</FieldLabel>
              <Input
                id="inicio-toneladas"
                type="number"
                inputMode="decimal"
                min={0}
                step={0.1}
                value={toneladas}
                onChange={(e) => setToneladas(e.target.value)}
                aria-invalid={sinFruta || undefined}
                className={NUMERO}
                disabled={isPending}
              />
              {sinFruta ? (
                <FieldError>Ingresa las toneladas que tienes.</FieldError>
              ) : (
                <FieldDescription className="tabular-nums">
                  ≈ {formatInt(jabasDia)} jabas · meta {formatDecimal(jabasATon(meta))} t
                  {difJabas !== 0 ? (
                    <span className={cn("font-semibold", difJabas < 0 ? "text-destructive" : "text-foreground")}>
                      {" "}
                      ({signo(difJabas)} jabas)
                    </span>
                  ) : null}
                </FieldDescription>
              )}
            </Field>
            <Field>
              <FieldLabel htmlFor="inicio-trabajadores">Trabajadores con los que inicias</FieldLabel>
              <Input
                id="inicio-trabajadores"
                type="number"
                inputMode="numeric"
                min={0}
                step={1}
                value={trabajadoresTxt}
                onChange={(e) => setTrabajadoresTxt(e.target.value)}
                aria-invalid={totalInician < 1 || undefined}
                className={NUMERO}
                disabled={isPending}
              />
              {totalInician < 1 ? (
                <FieldError>Indica con cuántas personas inicias.</FieldError>
              ) : (
                <FieldDescription className="tabular-nums">
                  plan {formatInt(trabajadoresPlan)}
                  {totalInician !== trabajadoresPlan ? (
                    <span
                      className={cn(
                        "font-semibold",
                        totalInician < trabajadoresPlan ? "text-destructive" : "text-success-foreground",
                      )}
                    >
                      {" "}
                      ({signo(totalInician - trabajadoresPlan)})
                    </span>
                  ) : null}
                </FieldDescription>
              )}
            </Field>
          </FieldGroup>
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
              disabled={isPending || sinFruta || totalInician < 1}
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
          Estimado = jabas del día ÷ (trabajadores × {formatDecimal(p.rendimientoPersonaHora)}{" "}
          jabas por persona-hora × {formatInt(p.factorEficiencia * 100)}% de eficiencia). Parámetros
          del plan de Planta {props.plantaNombre}. Una jaba ≈ {formatDecimal(KG_POR_JABA)} kg.
        </p>
      </aside>
    </div>
  )
}
