"use client"

import { useState, useTransition } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { formatInt } from "@/lib/format"
import { registrarEnJornadaAction } from "../actions"
import { horaFin } from "../lib/jornada"

const NUMERO = "h-12 text-lg tabular-nums md:text-lg"

interface RegistroFormProps {
  jornadaId: number
  horaSugerida: string
  /** Acumulados del último avance, como referencia. */
  ultimoAvance: { recibidas: number; procesadas: number } | null
}

type Campo = "hora" | "procesadas"

function aNumero(valor: string): number {
  return valor.trim() === "" ? Number.NaN : Number(valor)
}

/** "Registrar avance": hora y jabas procesadas acumuladas. */
export function RegistroForm({ jornadaId, horaSugerida, ultimoAvance }: RegistroFormProps) {
  const [hora, setHora] = useState(horaSugerida)
  const [procesadas, setProcesadas] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const campoError: Campo | null = error ? (/hora/i.test(error) ? "hora" : "procesadas") : null
  /** Props de error para el input de un campo y su mensaje debajo. */
  const invalido = (campo: Campo) =>
    campoError === campo ? { "aria-invalid": true, "aria-describedby": `registro-error-${campo}` } : {}
  const mensaje = (campo: Campo) =>
    campoError === campo ? <FieldError id={`registro-error-${campo}`}>{error}</FieldError> : null

  const guardar = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    const jabasProcesadasAcum = aNumero(procesadas)
    if (!Number.isFinite(jabasProcesadasAcum)) {
      setError("Ingresa las jabas procesadas.")
      return
    }
    startTransition(async () => {
      // Por ahora solo se informa lo procesado: lo recibido es al menos eso (y nunca baja).
      const res = await registrarEnJornadaAction(jornadaId, {
        tipo: "AVANCE",
        hora,
        jabasProcesadasAcum,
        jabasRecibidasAcum: Math.max(jabasProcesadasAcum, ultimoAvance?.recibidas ?? 0),
      })
      if (!res.ok) {
        setError(res.error)
        return
      }
      toast.success("Avance guardado", { description: "El estimado ya está actualizado." })
      setProcesadas("")
      setHora(horaFin(hora, 1))
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Registrar avance</CardTitle>
        <CardDescription>
          Cuántas jabas se procesaron hasta ahora (acumulado). Con esto el sistema calcula el ritmo
          real.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={guardar} className="flex flex-col gap-5" noValidate>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="registro-hora">Hora</FieldLabel>
              <Input
                id="registro-hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={NUMERO}
                required
                {...invalido("hora")}
              />
              {mensaje("hora")}
            </Field>
            <Field>
              <FieldLabel htmlFor="registro-procesadas">Jabas procesadas (acum.)</FieldLabel>
              <Input
                id="registro-procesadas"
                type="number"
                inputMode="numeric"
                min={0}
                value={procesadas}
                onChange={(e) => setProcesadas(e.target.value)}
                placeholder={ultimoAvance ? `último ${formatInt(ultimoAvance.procesadas)}` : undefined}
                className={NUMERO}
                required
                {...invalido("procesadas")}
              />
              {mensaje("procesadas")}
            </Field>
          </div>

          <Button type="submit" size="lg" className="h-12 self-start px-6 text-base" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" aria-hidden />}
            Guardar avance
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
