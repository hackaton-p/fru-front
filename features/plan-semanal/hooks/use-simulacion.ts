"use client"

import { useEffect, useMemo, useRef, useState, useTransition } from "react"
import type {
  CalcularPlanInput,
  EscenarioCosecha,
  ParametrosPlanta,
  PlanCalculado,
  SemanaQuery,
} from "@/lib/domain"
import { simularPlanAction } from "../actions"
import { usePlanParametros } from "./use-plan-parametros"

const DEBOUNCE_MS = 350

interface UseSimulacionArgs {
  query: SemanaQuery
  /** Valores por defecto de la planta. */
  defaults: ParametrosPlanta
  initial: {
    escenario: EscenarioCosecha
    parametros: ParametrosPlanta
    resultado: PlanCalculado
  }
}

/**
 * Estado de la simulación (Paso 1). Cada cambio de escenario o de parámetros
 * pide al back un nuevo cálculo, con debounce y descartando respuestas viejas.
 */
export function useSimulacion({ query, defaults, initial }: UseSimulacionArgs) {
  const [escenario, setEscenario] = useState<EscenarioCosecha>(initial.escenario)
  const parametros = usePlanParametros(defaults, initial.parametros)
  const [resultado, setResultado] = useState<PlanCalculado>(initial.resultado)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  const { plantaId, frutaId, anio, semana } = query
  const input = useMemo<CalcularPlanInput | null>(
    () =>
      parametros.values
        ? {
            plantaId,
            frutaId,
            anio,
            semana,
            escenarioCosecha: escenario,
            parametros: parametros.values,
          }
        : null,
    [plantaId, frutaId, anio, semana, escenario, parametros.values],
  )
  const inputKey = input ? JSON.stringify(input) : null

  /** Clave del último cálculo pedido; el resultado inicial corresponde al input inicial. */
  const requestedKey = useRef(inputKey)
  const [resultadoKey, setResultadoKey] = useState(inputKey)

  useEffect(() => {
    if (!input || inputKey === requestedKey.current) return
    const timer = setTimeout(() => {
      requestedKey.current = inputKey
      startTransition(async () => {
        const res = await simularPlanAction(input)
        if (requestedKey.current !== inputKey) return // llegó una respuesta vieja
        if (res.ok) {
          setResultado(res.data)
          setResultadoKey(inputKey)
          setError(null)
        } else {
          setError(res.error)
        }
      })
    }, DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [input, inputKey])

  return {
    escenario,
    setEscenario,
    parametros,
    resultado,
    /** Input del cálculo mostrado; null si hay parámetros inválidos. */
    input,
    error,
    /** true mientras el resultado mostrado no corresponde a lo seleccionado. */
    isStale: isPending || inputKey === null || resultadoKey !== inputKey,
  }
}
