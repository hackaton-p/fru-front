"use client"

import { useEffect } from "react"
import { RotateCw, TriangleAlert } from "lucide-react"
import { Alert, AlertAction, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"

export default function SubgerenteError({
  error,
  retry,
}: {
  error: Error & { digest?: string }
  retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <Alert variant="destructive">
      <TriangleAlert aria-hidden />
      <AlertTitle>No se pudieron cargar los planes</AlertTitle>
      <AlertDescription>
        <p>
          Revisa tu conexión o que el servicio de planificación esté disponible.
          {error.digest ? ` (ref. ${error.digest})` : ""}
        </p>
      </AlertDescription>
      <AlertAction>
        <Button size="sm" variant="outline" onClick={() => retry()}>
          <RotateCw data-icon="inline-start" aria-hidden />
          Reintentar
        </Button>
      </AlertAction>
    </Alert>
  )
}
