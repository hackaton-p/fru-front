"use client"

import { useEffect, useRef, useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { ClipboardList, TriangleAlert } from "lucide-react"
import { toast } from "sonner"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Empty, EmptyDescription, EmptyHeader, EmptyMedia, EmptyTitle } from "@/components/ui/empty"
import { Spinner } from "@/components/ui/spinner"
import type { SemanaQuery } from "@/lib/domain"
import { crearPlanOficialAction } from "../actions"

interface AutoGenerarPlanProps {
  query: SemanaQuery
  /** Configuración, programa comercial y proyección de cosecha completos. */
  listo: boolean
}

/**
 * Genera el plan en cuanto el programa comercial y la proyección de cosecha están
 * completos, y lleva al usuario a la planificación generada.
 */
export function AutoGenerarPlan({ query, listo }: AutoGenerarPlanProps) {
  const router = useRouter()
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const intentado = useRef(false)

  const generar = () => {
    setError(null)
    startTransition(async () => {
      const result = await crearPlanOficialAction(query)
      if (!result.ok) { setError(result.error); return }
      toast.success("Planificación generada", { description: "Revísala y envíala a aprobación cuando esté lista." })
      router.replace(`/planificador/${result.data.id}/editar#planificacion-generada`)
    })
  }

  useEffect(() => {
    if (!listo || intentado.current) return
    intentado.current = true
    generar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listo])

  const generando = pending || (listo && !error)
  return (
    <Card id="planificacion-generada" className="scroll-mt-20" aria-busy={generando}>
      <CardHeader>
        <CardTitle>Planificación generada</CardTitle>
        <CardDescription>Se genera automáticamente al completar el programa comercial y la proyección de cosecha.</CardDescription>
      </CardHeader>
      <CardContent>
        {error ? (
          <Alert variant="destructive">
            <TriangleAlert aria-hidden />
            <AlertTitle>No se pudo generar la planificación</AlertTitle>
            <AlertDescription>
              <p>{error}</p>
              <Button className="mt-2" size="sm" variant="outline" onClick={generar}>Reintentar</Button>
            </AlertDescription>
          </Alert>
        ) : generando ? (
          <div role="status" className="flex items-center gap-3 py-8 text-muted-foreground">
            <Spinner />
            <p>Generando la planificación con tus proyecciones…</p>
          </div>
        ) : (
          <Empty className="border border-dashed">
            <EmptyHeader>
              <EmptyMedia variant="icon"><ClipboardList /></EmptyMedia>
              <EmptyTitle>Aún no hay planificación</EmptyTitle>
              <EmptyDescription>Completa los pasos 2 y 3 y la planificación se generará sola.</EmptyDescription>
            </EmptyHeader>
          </Empty>
        )}
      </CardContent>
    </Card>
  )
}
