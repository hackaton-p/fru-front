"use client"

import { useTransition } from "react"
import { Send } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { enviarPlanAction } from "../actions"

interface EnviarAprobacionButtonProps {
  planId: number | null
  /** Solo se habilita cuando existe un plan oficial en borrador. */
  disabled: boolean
}

export function EnviarAprobacionButton({ planId, disabled }: EnviarAprobacionButtonProps) {
  const [isPending, startTransition] = useTransition()

  const enviar = () => {
    if (planId === null) return
    startTransition(async () => {
      const res = await enviarPlanAction(planId)
      if (res.ok) toast.success("Plan enviado a aprobación")
      else toast.error("No se pudo enviar el plan", { description: res.error })
    })
  }

  return (
    <Button disabled={disabled || planId === null || isPending} onClick={enviar}>
      {isPending ? <Spinner data-icon="inline-start" /> : <Send data-icon="inline-start" aria-hidden />}
      Enviar a aprobación
    </Button>
  )
}
