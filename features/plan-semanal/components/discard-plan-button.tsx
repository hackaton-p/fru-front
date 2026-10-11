"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import { descartarPlanAction } from "../actions"

export function DiscardPlanButton({ planId }: { planId: number }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return <Dialog open={open} onOpenChange={setOpen}><DialogTrigger asChild><Button variant="outline" size="sm">Descartar</Button></DialogTrigger><DialogContent><DialogHeader><DialogTitle>¿Descartar el plan #{planId}?</DialogTitle><DialogDescription>Se eliminará este plan. Las proyecciones de la semana se conservan para crear otra planificación.</DialogDescription></DialogHeader>{error && <p role="alert" className="text-destructive">{error}</p>}<DialogFooter><Button variant="outline" disabled={pending} onClick={() => setOpen(false)}>Cancelar</Button><Button variant="destructive" disabled={pending} onClick={() => startTransition(async () => {
    setError(null)
    const result = await descartarPlanAction(planId)
    if (result.ok) { toast.success("Plan descartado"); setOpen(false); router.push("/planificador"); router.refresh() }
    else setError(result.error)
  })}>{pending ? "Descartando…" : "Descartar plan"}</Button></DialogFooter></DialogContent></Dialog>
}
