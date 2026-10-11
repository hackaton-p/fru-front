export type TipoProyeccion = "COSECHA" | "COMERCIAL"

/** Filtro común de proyecciones: planta, fruta, año y semana. */
export interface SemanaQuery {
  inicio?: string
  cantidadDias?: number
  fechas?: string[]
  plantaId: number
  frutaId: number
  anio: number
  semana: number
}

/** Cosecha prevista para un día, en jabas (única unidad de fruta). */
export interface ProyeccionCosechaDia {
  /** Fecha ISO (YYYY-MM-DD). */
  fecha: string
  jabas: number
}

/** Programa comercial de la semana para un cliente, en jabas. */
export interface ProyeccionComercialCliente {
  clienteId: number
  cliente: string
  /** País del cliente, si el origen de datos lo conoce. */
  pais?: string
  jabas: number
}

export interface ImportarProyeccionInput extends SemanaQuery {
  planId?: number
  tipo: TipoProyeccion
  archivo: File
}

export interface ImportarProyeccionResultado {
  registros: number
  /** El plan en edición se recalculó con la proyección guardada. */
  planActualizado?: boolean
}

export interface GuardarProyeccionInput extends SemanaQuery {
  /** Plan en edición: si viene, se recalcula con la proyección guardada. */
  planId?: number
  tipo: TipoProyeccion
  registros: { fecha?: string; cliente?: string; pais?: string; jabas: number }[]
}
