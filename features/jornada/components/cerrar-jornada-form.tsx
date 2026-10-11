"use client"

import { useState, useTransition } from "react"
import { Lock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { CerrarJornadaInput } from "@/lib/domain"
import { formatHoras, formatInt } from "@/lib/format"
import { cerrarJornadaAction } from "../actions"

/** Por ahora el cierre solo pide horas y jabas; descarte y kg van en 0. */
type CampoCierre = "horasTrabajadas" | "jabasProcesadas"

const CAMPOS: { key: CampoCierre; label: string; step: number }[] = [
  { key: "horasTrabajadas", label: "Horas trabajadas", step: 0.1 },
  { key: "jabasProcesadas", label: "Jabas procesadas", step: 1 },
]

interface CerrarJornadaFormProps {
  jornadaId: number
  /** Valores sugeridos: el estimado vigente. */
  horasSugeridas: number
  jabasSugeridas: number
  frutaMeta?: { frutaId: number; fruta: string; jabasMeta: number }[]
  jabasPorFruta?: { frutaId: number; fruta: string; jabas: number }[]
}

type Valores = Record<CampoCierre, string>

/** Cierre: cifras reales del día, con confirmación antes de cerrar. */
export function CerrarJornadaForm({ jornadaId, horasSugeridas, jabasSugeridas, frutaMeta = [], jabasPorFruta = [] }: CerrarJornadaFormProps) {
  const [valores, setValores] = useState<Valores>({
    horasTrabajadas: String(Math.round(horasSugeridas * 10) / 10),
    jabasProcesadas: String(Math.round(jabasSugeridas)),
  })
  const [confirmando, setConfirmando] = useState(false)
  const [porFruta, setPorFruta] = useState<Record<number, string>>(() => Object.fromEntries(frutaMeta.map((target) => [target.frutaId, String(jabasPorFruta.find((row) => row.frutaId === target.frutaId)?.jabas ?? (jabasSugeridas * target.jabasMeta / Math.max(1, frutaMeta.reduce((sum, row) => sum + row.jabasMeta, 0))))])))
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const num = (key: CampoCierre) =>
    valores[key].trim() === "" ? Number.NaN : Number(valores[key])
  const datos: CerrarJornadaInput = {
    horasTrabajadas: num("horasTrabajadas"),
    jabasProcesadas: num("jabasProcesadas"),
    jabasPorFruta: frutaMeta.length ? frutaMeta.map((row) => ({ frutaId: row.frutaId, fruta: row.fruta, jabas: Number(porFruta[row.frutaId] ?? 0) })) : undefined,
    jabasDescarte: 0,
    kgLoose: 0,
    kgFijo: 0,
  }
  const faltante = CAMPOS.find((c) => !Number.isFinite(datos[c.key]))

  const pedirConfirmacion = (e: React.FormEvent) => {
    e.preventDefault()
    if (faltante) {
      setError(`Completa «${faltante.label}».`)
      document.getElementById(`cierre-${faltante.key}`)?.focus()
      return
    }
    if (datos.jabasPorFruta && Math.abs(datos.jabasPorFruta.reduce((sum, row) => sum + row.jabas, 0) - datos.jabasProcesadas) >= 0.0001) {
      setError("El desglose por fruta debe sumar las jabas procesadas.")
      return
    }
    setError(null)
    setConfirmando(true)
  }

  const cerrar = () => {
    startTransition(async () => {
      const res = await cerrarJornadaAction(jornadaId, datos)
      if (res.ok) {
        toast.success("Jornada cerrada")
        return
      }
      setConfirmando(false)
      setError(res.error)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Cerrar jornada</CardTitle>
        <CardDescription>
          Ingresa las cifras reales del día. Las horas y las jabas parten del estimado actual.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={pedirConfirmacion} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:max-w-2xl">
            {CAMPOS.map((c) => (
              <Field key={c.key}>
                <FieldLabel htmlFor={`cierre-${c.key}`}>{c.label}</FieldLabel>
                <Input
                  id={`cierre-${c.key}`}
                  type="number"
                  inputMode="decimal"
                  min={0}
                  step={c.step}
                  value={valores[c.key]}
                  onChange={(e) => {
                    setValores((v) => ({ ...v, [c.key]: e.target.value }))
                    setConfirmando(false)
                  }}
                  aria-invalid={error && faltante?.key === c.key ? true : undefined}
                  className="h-12 text-lg tabular-nums md:text-lg"
                  disabled={isPending}
                />
              </Field>
            ))}
            {frutaMeta.map((row) => <Field key={row.frutaId}>
              <FieldLabel htmlFor={`cierre-fruta-${row.frutaId}`}>{row.fruta} (jabas)</FieldLabel>
              <Input id={`cierre-fruta-${row.frutaId}`} type="number" inputMode="numeric" min={0} step={1} value={porFruta[row.frutaId] ?? "0"} onChange={(e) => { setPorFruta((current) => ({ ...current, [row.frutaId]: e.target.value })); setConfirmando(false) }} className="h-12 text-lg tabular-nums md:text-lg" disabled={isPending} />
            </Field>)}
          </div>
          {frutaMeta.length ? <p className="text-sm text-muted-foreground">El desglose debe sumar {formatInt(datos.jabasProcesadas)} jabas.</p> : null}

          {error ? <FieldError>{error}</FieldError> : null}

          {confirmando ? (
            <div
              role="alert"
              className="flex flex-col gap-3 rounded-lg border border-chart-2 bg-warning px-4 py-3 text-warning-foreground sm:flex-row sm:items-center sm:justify-between"
            >
              <p className="font-medium">
                Vas a cerrar la jornada con {formatInt(datos.jabasProcesadas)} jabas en{" "}
                {formatHoras(datos.horasTrabajadas)}. Después ya no se puede registrar.
              </p>
              <div className="flex shrink-0 flex-wrap gap-2">
                <Button size="lg" className="h-12 text-base" onClick={cerrar} disabled={isPending}>
                  {isPending ? <Spinner data-icon="inline-start" /> : <Lock data-icon="inline-start" aria-hidden />}
                  Confirmar cierre
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="h-12 text-base"
                  onClick={() => setConfirmando(false)}
                  disabled={isPending}
                >
                  Volver
                </Button>
              </div>
            </div>
          ) : (
            <Button type="submit" size="lg" variant="outline" className="h-12 self-start px-6 text-base">
              <Lock data-icon="inline-start" aria-hidden />
              Cerrar jornada
            </Button>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
