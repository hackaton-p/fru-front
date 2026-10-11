export type TipoProyeccion = "COSECHA" | "COMERCIAL"

/** Filtro común de proyecciones: planta, fruta, año y semana. */
export interface SemanaQuery {
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
  jabas: number
}

export interface ImportarProyeccionInput extends SemanaQuery {
  tipo: TipoProyeccion
  archivo: File
}

export interface ImportarProyeccionResultado {
  registros: number
}
