"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card"
import type { SemanaQuery } from "@/lib/domain"
import { crearPlanOficialAction } from "../actions"

export function CreateOfficialPlan({ query, enabled, existing = false }: { query: SemanaQuery; enabled: boolean; existing?: boolean }) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  return <Card><CardHeader><CardTitle>4. {existing ? "Actualizar plan oficial" : "Crear plan oficial"}</CardTitle><CardDescription>El plan se calcula con las proyecciones registradas y los parámetros confirmados de la planta. Después podrás enviarlo a aprobación.</CardDescription></CardHeader><CardContent className="space-y-3">
    {!enabled && <p className="text-sm text-muted-foreground">Completa la configuración, el programa comercial y la proyección de cosecha para continuar.</p>}
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <Button disabled={!enabled || pending} onClick={() => startTransition(async () => {
      setError(null)
      const result = await crearPlanOficialAction(query)
      if (result.ok) router.push(`/planificador?vista=detalle&plan=${result.data.id}`)
      else setError(result.error)
    })}>{pending ? "Guardando…" : existing ? "Actualizar con parámetros de la planta" : "Crear plan oficial"}</Button>
  </CardContent></Card>
}
