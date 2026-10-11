import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldDescription, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { ParametrosPlanta } from "@/lib/domain"
import { parametroDef } from "@/lib/parametros"
import { cn } from "@/lib/utils"
import {
  formatCampo,
  type CampoConfig,
  type CampoDef,
  type ConfigErrors,
  type ConfigInput,
  type GrupoDef,
} from "../lib/configuracion"

interface GrupoParametrosProps {
  grupo: GrupoDef
  plantaId: number
  guardados: ParametrosPlanta
  /** Sin `edicion`, los valores se muestran como lectura. */
  edicion?: {
    input: ConfigInput
    errors: ConfigErrors
    cambiados: CampoConfig[]
    disabled: boolean
    onChange: (key: CampoConfig, value: string) => void
  }
}

/** Un bloque de parámetros ("Personal y rendimiento", "Jornada", ...). */
export function GrupoParametros({ grupo, plantaId, guardados, edicion }: GrupoParametrosProps) {
  return (
    <Card className="gap-5 py-5 [--card-spacing:--spacing(5)]">
      <CardHeader>
        <CardTitle className="font-heading text-xl font-bold">{grupo.titulo}</CardTitle>
        <CardDescription>{grupo.descripcion}</CardDescription>
      </CardHeader>
      <CardContent>
        {edicion ? (
          <div className="grid grid-cols-1 gap-x-5 gap-y-6 sm:grid-cols-2">
            {grupo.campos.map((campo) => (
              <CampoEditable
                key={campo.key}
                campo={campo}
                id={`cfg-${plantaId}-${campo.key}`}
                guardados={guardados}
                {...edicion}
              />
            ))}
          </div>
        ) : (
          <dl className="grid grid-cols-1 gap-x-5 gap-y-5 sm:grid-cols-2">
            {grupo.campos.map((campo) => (
              <div key={campo.key} className="flex flex-col gap-1">
                <dt className="text-sm font-semibold">{campo.label}</dt>
                <dd className="font-heading text-2xl font-bold tabular-nums">
                  {formatCampo(campo.key, guardados)}
                </dd>
                <dd className="text-sm text-muted-foreground">{campo.ayuda}</dd>
              </div>
            ))}
          </dl>
        )}
      </CardContent>
    </Card>
  )
}

function CampoEditable({
  campo,
  id,
  guardados,
  input,
  errors,
  cambiados,
  disabled,
  onChange,
}: { campo: CampoDef; id: string; guardados: ParametrosPlanta } & NonNullable<
  GrupoParametrosProps["edicion"]
>) {
  const error = errors[campo.key]
  const cambiado = cambiados.includes(campo.key)
  const def = campo.key === "horaInicio" ? null : parametroDef(campo.key)
  const ayudaId = `${id}-ayuda`

  return (
    <Field data-invalid={error ? true : undefined}>
      <div className="flex flex-wrap items-center gap-2">
        <FieldLabel htmlFor={id}>{campo.label}</FieldLabel>
        {cambiado && !error ? (
          <Badge variant="outline" className="border-chart-2 bg-warning text-warning-foreground">
            Antes {formatCampo(campo.key, guardados)}
          </Badge>
        ) : null}
      </div>
      <div className="flex items-center gap-3">
        <Input
          id={id}
          type={def ? "number" : "time"}
          inputMode={def ? (def.integer ? "numeric" : "decimal") : undefined}
          min={def?.min}
          max={def?.max}
          step={def?.step}
          value={input[campo.key]}
          onChange={(e) => onChange(campo.key, e.target.value)}
          disabled={disabled}
          aria-invalid={error ? true : undefined}
          aria-describedby={ayudaId}
          className={cn(
            "h-12 text-base font-semibold tabular-nums",
            cambiado && !error && "border-chart-2 bg-warning/40",
          )}
        />
        {/* Siempre ocupa el espacio de la unidad, para que todos los inputs midan igual. */}
        <span className="min-w-16 text-sm text-muted-foreground" aria-hidden={!campo.unidad}>
          {campo.unidad}
        </span>
      </div>
      {error ? <FieldError>{error}</FieldError> : null}
      <FieldDescription id={ayudaId}>{campo.ayuda}</FieldDescription>
    </Field>
  )
}
