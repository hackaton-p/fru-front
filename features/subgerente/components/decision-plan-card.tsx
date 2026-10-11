"use client"

import { useState, useTransition } from "react"
import { CircleCheck, Undo2 } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Spinner } from "@/components/ui/spinner"
import { Textarea } from "@/components/ui/textarea"
import { aprobarPlanAction, rechazarPlanAction } from "../actions"

const COMENTARIO_MAX = 500
const COMENTARIO_ID = "comentario-decision"

/** Bloque "Tu decisión" del detalle: aprobar, o rechazar y devolver con comentario. */
interface DecisionPlanCardProps {
  planId: number
  /** La cosecha no cubre el programa comercial (cambia el ejemplo del comentario). */
  hayBrecha: boolean
}

export function DecisionPlanCard({ planId, hayBrecha }: DecisionPlanCardProps) {
  const [comentario, setComentario] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [accion, setAccion] = useState<"aprobar" | "rechazar" | null>(null)
  const [isPending, startTransition] = useTransition()

  const aprobar = () => {
    setError(null)
    setAccion("aprobar")
    startTransition(async () => {
      const res = await aprobarPlanAction(planId)
      if (res.ok) toast.success("Plan aprobado", { description: "El jefe de turno ya puede ejecutarlo." })
      else toast.error("No se pudo aprobar el plan", { description: res.error })
    })
  }

  const rechazar = () => {
    if (!comentario.trim()) {
      setError("Escribe un comentario para rechazar el plan.")
      document.getElementById(COMENTARIO_ID)?.focus()
      return
    }
    setError(null)
    setAccion("rechazar")
    startTransition(async () => {
      const res = await rechazarPlanAction(planId, comentario)
      if (res.ok) toast.success("Plan devuelto al planificador")
      else toast.error("No se pudo rechazar el plan", { description: res.error })
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Tu decisión</CardTitle>
        <CardDescription className="max-w-prose text-pretty">
          Al aprobarlo, las metas diarias quedan fijas y el jefe de turno puede ejecutarlo; durante
          la semana solo se ajustan horas. Si lo rechazas, vuelve al planificador con tu comentario.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <Field data-invalid={error ? true : undefined}>
          <FieldLabel htmlFor={COMENTARIO_ID}>Comentario (obligatorio si se rechaza)</FieldLabel>
          <Textarea
            id={COMENTARIO_ID}
            value={comentario}
            maxLength={COMENTARIO_MAX}
            rows={3}
            disabled={isPending}
            aria-invalid={error ? true : undefined}
            placeholder={
              hayBrecha
                ? "Ej.: confirmar con comercial cómo cubrir las jabas que faltan"
                : "Ej.: revisar la eficiencia antes de fijar las metas"
            }
            onChange={(e) => {
              setComentario(e.target.value)
              if (error) setError(null)
            }}
          />
          {error ? (
            <FieldError>{error}</FieldError>
          ) : (
            <FieldDescription>El planificador lo verá al abrir su plan.</FieldDescription>
          )}
        </Field>
        <div className="flex flex-wrap gap-3">
          <Button size="lg" onClick={aprobar} disabled={isPending}>
            {isPending && accion === "aprobar" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <CircleCheck data-icon="inline-start" aria-hidden />
            )}
            Aprobar plan
          </Button>
          <Button size="lg" variant="destructive" onClick={rechazar} disabled={isPending}>
            {isPending && accion === "rechazar" ? (
              <Spinner data-icon="inline-start" />
            ) : (
              <Undo2 data-icon="inline-start" aria-hidden />
            )}
            Rechazar y devolver
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
