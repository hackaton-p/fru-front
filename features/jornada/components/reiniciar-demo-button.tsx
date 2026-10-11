"use client"

import { useTransition } from "react"
import { RotateCcw } from "lucide-react"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { reiniciarJornadaDemoAction } from "../actions"

/** Solo con datos de ejemplo: borra la jornada para repetir la demo. */
export function ReiniciarDemoButton() {
  const [isPending, startTransition] = useTransition()

  const reiniciar = () => {
    startTransition(async () => {
      const res = await reiniciarJornadaDemoAction()
      if (res.ok) toast.success("Jornada reiniciada")
      else toast.error("No se pudo reiniciar", { description: res.error })
    })
  }

  return (
    <Button variant="ghost" onClick={reiniciar} disabled={isPending}>
      {isPending ? <Spinner data-icon="inline-start" /> : <RotateCcw data-icon="inline-start" aria-hidden />}
      Reiniciar jornada (demo)
    </Button>
  )
}
