"use client"

import { useTransition } from "react"
import { Clock } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import type { MotivoAjuste } from "@/lib/domain"
import { formatHoras } from "@/lib/format"
import { ajustarHorasAction } from "../actions"

interface AjustarHorasButtonProps {
  jornadaId: number
  horas: number
  motivo: MotivoAjuste
}

/** Acepta el estimado como horas actualizadas del día. */
export function AjustarHorasButton({ jornadaId, horas, motivo }: AjustarHorasButtonProps) {
  const [isPending, startTransition] = useTransition()
  const horasActualizadas = Math.round(horas * 10) / 10

  const ajustar = () => {
    startTransition(async () => {
      const res = await ajustarHorasAction(jornadaId, { horasActualizadas, motivoAjuste: motivo })
      if (res.ok) toast.success(`Horas del día actualizadas a ${formatHoras(horasActualizadas)}`)
      else toast.error("No se pudieron actualizar las horas", { description: res.error })
    })
  }

  return (
    <Button size="lg" className="h-12 text-base" onClick={ajustar} disabled={isPending}>
      {isPending ? <Spinner data-icon="inline-start" /> : <Clock data-icon="inline-start" aria-hidden />}
      Actualizar horas a {formatHoras(horasActualizadas)}
    </Button>
  )
}
