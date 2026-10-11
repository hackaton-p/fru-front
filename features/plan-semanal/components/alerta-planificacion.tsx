import { TriangleAlert } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { formatInt, formatPercent } from "@/lib/format"
import { calcularBrecha } from "../lib/brecha"

interface AlertaPlanificacionProps {
  cosechaJabas: number
  comercialJabas: number
}

/** Aparece solo si la cosecha no cubre el programa comercial. */
export function AlertaPlanificacion({ cosechaJabas, comercialJabas }: AlertaPlanificacionProps) {
  const brecha = calcularBrecha(cosechaJabas, comercialJabas)
  if (!brecha.hayBrecha) return null

  return (
    <Alert variant="destructive" className="border-destructive/50 bg-destructive/10 px-4 py-3 text-base shadow-sm">
      <TriangleAlert aria-hidden />
      <AlertTitle className="text-base font-semibold">Alerta de planificación: la cosecha no cubre el programa comercial</AlertTitle>
      <AlertDescription>
        <p className="text-sm">
          Cosecha {formatInt(cosechaJabas)} jabas · Programa comercial {formatInt(comercialJabas)}{" "}
          jabas · Faltan{" "}
          <strong>
            {formatInt(brecha.jabas)} jabas ({formatPercent(brecha.porcentaje)})
          </strong>
          .
        </p>
      </AlertDescription>
    </Alert>
  )
}
