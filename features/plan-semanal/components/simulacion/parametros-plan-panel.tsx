"use client"

import { useState } from "react"
import Link from "next/link"
import { ChevronDown, RotateCcw } from "lucide-react"
import { ParametrosResumen, describirCambios } from "@/components/shared/parametros-resumen"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import type { ParametrosPlanta, Planta } from "@/lib/domain"
import { PARAMETROS } from "@/lib/parametros"
import { cn } from "@/lib/utils"
import type { PlanParametros } from "../../hooks/use-plan-parametros"

interface ParametrosPlanPanelProps {
  planta: Planta
  defaults: ParametrosPlanta
  parametros: PlanParametros
  disabled?: boolean
}

/**
 * "Parámetros del plan": arranca con los valores por defecto de la planta y el
 * planificador puede cambiarlos. Lo que difiere del default queda marcado.
 */
export function ParametrosPlanPanel({
  planta,
  defaults,
  parametros,
  disabled,
}: ParametrosPlanPanelProps) {
  const [open, setOpen] = useState(false)

  return (
    <FieldSet>
      <FieldLegend>Parámetros del plan · Planta {planta.nombre}</FieldLegend>
      <FieldDescription>
        {parametros.values
          ? describirCambios(parametros.values, defaults)
          : "Hay valores inválidos"}{" "}
        ·{" "}
        <Link href="/configuracion" className="underline underline-offset-4">
          Ver configuración de planta
        </Link>
      </FieldDescription>

      {parametros.values ? (
        <ParametrosResumen valores={parametros.values} defaults={defaults} />
      ) : null}

      <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-4">
        <CollapsibleTrigger asChild>
          <Button variant="outline" className="w-fit" disabled={disabled}>
            <ChevronDown
              data-icon="inline-start"
              aria-hidden
              className={cn("transition-transform", open && "rotate-180")}
            />
            Editar parámetros
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent className="flex flex-col gap-4">
          <FieldGroup className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {PARAMETROS.map((def) => {
              const id = `param-${def.key}`
              const error = parametros.errors[def.key]
              return (
                <Field key={def.key} data-invalid={error ? true : undefined}>
                  <FieldLabel htmlFor={id}>{def.label}</FieldLabel>
                  <Input
                    id={id}
                    type="number"
                    inputMode="decimal"
                    min={def.min}
                    max={def.max}
                    step={def.step}
                    value={parametros.input[def.key]}
                    onChange={(e) => parametros.setValue(def.key, e.target.value)}
                    disabled={disabled}
                    aria-invalid={error ? true : undefined}
                  />
                  {error ? (
                    <FieldError>{error}</FieldError>
                  ) : (
                    <FieldDescription>
                      Default de la planta: {def.format(defaults[def.key])}
                      {parametros.isModified(def.key) ? " · cambiado" : ""}
                    </FieldDescription>
                  )}
                </Field>
              )
            })}
          </FieldGroup>
          <Button
            type="button"
            variant="ghost"
            className="w-fit"
            onClick={parametros.reset}
            disabled={disabled || parametros.modificados.length === 0}
          >
            <RotateCcw data-icon="inline-start" aria-hidden />
            Restablecer valores por defecto
          </Button>
        </CollapsibleContent>
      </Collapsible>
    </FieldSet>
  )
}
