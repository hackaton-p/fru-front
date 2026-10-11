"use client"

import { useCallback, useMemo, useState } from "react"
import type { ParametroEditable, ParametrosPlanta } from "@/lib/domain"
import {
  parametrosDistintos,
  parseParametros,
  toInput,
  type ParametrosInput,
} from "@/lib/parametros"

/**
 * Estado del panel "Parámetros del plan". Arranca con `initial` (defaults de la
 * planta o valores del plan guardado) y marca lo que difiere de `defaults`.
 */
export function usePlanParametros(defaults: ParametrosPlanta, initial: ParametrosPlanta) {
  const [input, setInput] = useState<ParametrosInput>(() => toInput(initial))
  const { values, errors } = useMemo(() => parseParametros(input, defaults), [input, defaults])

  const modificados = useMemo(
    () => (values ? parametrosDistintos(values, defaults) : []),
    [values, defaults],
  )

  const setValue = useCallback((key: ParametroEditable, value: string) => {
    setInput((prev) => ({ ...prev, [key]: value }))
  }, [])

  const reset = useCallback(() => setInput(toInput(defaults)), [defaults])

  return {
    input,
    /** Valores finales válidos; null si hay algún campo inválido. */
    values,
    errors,
    modificados,
    isModified: (key: ParametroEditable) => modificados.includes(key),
    setValue,
    reset,
  }
}

export type PlanParametros = ReturnType<typeof usePlanParametros>
