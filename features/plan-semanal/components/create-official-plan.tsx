"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { SemanaQuery } from "@/lib/domain"
import { crearPlanOficialAction } from "../actions"

export function CreateOfficialPlan({ query, enabled, planId }: { query: SemanaQuery; enabled: boolean; planId?: number }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const [savedId, setSavedId] = useState(planId)
  return <Card><CardHeader><CardTitle>4. Ver planificación</CardTitle><CardDescription>Genera la planificación con las proyecciones y los parámetros de la planta. Revisa los resultados antes de enviarla a aprobación.</CardDescription></CardHeader><CardContent className="space-y-3">
    {!enabled && <p className="text-sm text-muted-foreground">Completa la configuración, el programa comercial y la proyección de cosecha para continuar.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button disabled={!enabled || pending} onClick={() => startTransition(async () => {
      setError(null)
      const result = await crearPlanOficialAction(query, savedId)
      if (result.ok) { setSavedId(result.data.id); router.replace(`/planificador?vista=detalle&plan=${result.data.id}#planificacion-generada`) }
      else setError(result.error)
    })}>{pending ? "Generando…" : "Ver planificación"}</Button>
  </CardContent></Card>
}
