import { ESCENARIOS_COSECHA, type EscenarioCosecha } from "@/lib/domain"

export const ESCENARIO_LABEL: Record<EscenarioCosecha, string> = {
  PROYECTADA: "Proyectada",
  "+10": "+10%",
  "+20": "+20%",
  "-10": "−10%",
}

export const ESCENARIO_OPCIONES = ESCENARIOS_COSECHA.map((value) => ({
  value,
  label: ESCENARIO_LABEL[value],
}))

export function isEscenario(value: string): value is EscenarioCosecha {
  return (ESCENARIOS_COSECHA as readonly string[]).includes(value)
}
