import { addDays, mondayOfIsoWeek, toIsoDate } from "@/lib/dates"
import type { Fruta, Planta, ProyeccionCosechaDia, ProyeccionComercialCliente } from "@/lib/domain"

/* Datos de ejemplo de "Plan de Packing · Pantallas" (semana 42). Todo en jabas. */

export const PLANTAS: Planta[] = [
  {
    id: 1,
    nombre: "Piura (Santa María)",
    rendimientoPersonaHora: 5.9,
    personalMaximo: 300,
    horasJornada: 10,
    horasExtraMax: 2,
    horaInicio: "17:00",
    factorEficiencia: 0.8,
    toleranciaVolumen: 5,
    updatedAt: "2026-10-08T14:30:00.000Z",
  },
  {
    id: 2,
    nombre: "Sullana",
    rendimientoPersonaHora: 3.9,
    personalMaximo: 1200,
    horasJornada: 12,
    horasExtraMax: 2,
    horaInicio: "17:00",
    factorEficiencia: 0.8,
    toleranciaVolumen: 5,
    updatedAt: "2026-10-02T16:10:00.000Z",
  },
]

export const FRUTAS: Fruta[] = [
  { id: 1, nombre: "Uva" },
  { id: 2, nombre: "Arándano" },
]

/** Jabas por día, de lunes a viernes. */
const COSECHA: Record<number, number[]> = {
  1: [12_000, 10_000, 12_000, 13_000, 13_000],
  2: [38_000, 40_000, 36_000, 42_000, 41_000],
}

const COMERCIAL: Record<number, [string, number][]> = {
  1: [
    ["Fruit Growers Alliance", 18_720],
    ["Summit Produce", 14_976],
    ["FairConnection", 9_984],
    ["Star Produce", 7_488],
    ["Parallel", 6_240],
    ["Sbrocco", 4_992],
  ],
  2: [
    ["Fruit Growers Alliance", 62_000],
    ["Summit Produce", 46_000],
    ["FairConnection", 34_000],
    ["Star Produce", 30_000],
    ["Parallel", 22_000],
  ],
}

export function cosechaMock(plantaId: number, semana: number): ProyeccionCosechaDia[] {
  const lunes = mondayOfIsoWeek(new Date().getUTCFullYear(), semana)
  return (COSECHA[plantaId] ?? []).map((jabas, i) => ({
    fecha: toIsoDate(addDays(lunes, i)),
    jabas,
  }))
}

export function comercialMock(plantaId: number): ProyeccionComercialCliente[] {
  return (COMERCIAL[plantaId] ?? []).map(([cliente, jabas], i) => ({
    clienteId: i + 1,
    cliente,
    jabas,
  }))
}
