/*
 * Toda la fruta se cuenta en jabas. Para mostrar el equivalente en toneladas
 * se usa el peso de referencia del contexto del negocio (8.2 kg por unidad).
 */
export const KG_POR_JABA = 8.2

/** Jabas → toneladas. */
export function jabasATon(jabas: number): number {
  return (jabas * KG_POR_JABA) / 1000
}

/** Toneladas → jabas (enteras). */
export function tonAJabas(toneladas: number): number {
  return Math.round((toneladas * 1000) / KG_POR_JABA)
}

export interface Fruta {
  id: number
  nombre: string
  activo?: boolean
  plantaIds?: number[]
}

export type FrutaCatalogoInput = Pick<Fruta, "nombre"> & {
  plantaIds: number[]
  activo?: boolean
}
