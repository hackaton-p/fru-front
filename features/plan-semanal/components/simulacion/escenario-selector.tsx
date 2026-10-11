"use client"

import { Field, FieldLabel } from "@/components/ui/field"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { EscenarioCosecha } from "@/lib/domain"
import { ESCENARIO_OPCIONES, isEscenario } from "../../lib/escenarios"

interface EscenarioSelectorProps {
  value: EscenarioCosecha
  onChange: (value: EscenarioCosecha) => void
  disabled?: boolean
}

/** Escenarios de cosecha: proyectada, +10%, +20% y −10%. */
export function EscenarioSelector({ value, onChange, disabled }: EscenarioSelectorProps) {
  return (
    <Field>
      <FieldLabel id="escenario-label">Escenario de cosecha</FieldLabel>
      <ToggleGroup
        type="single"
        variant="outline"
        value={value}
        onValueChange={(v) => isEscenario(v) && onChange(v)}
        aria-labelledby="escenario-label"
        disabled={disabled}
        className="flex-wrap"
      >
        {ESCENARIO_OPCIONES.map((opcion) => (
          <ToggleGroupItem key={opcion.value} value={opcion.value}>
            {opcion.label}
          </ToggleGroupItem>
        ))}
      </ToggleGroup>
    </Field>
  )
}
