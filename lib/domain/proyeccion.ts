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
  frutaId?: number
  fruta?: string
  /** Fecha ISO (YYYY-MM-DD). */
  fecha: string
  jabas: number
}

/** Programa comercial de la semana para un cliente, en jabas. */
export interface ProyeccionComercialCliente {
  frutaId?: number
  fruta?: string
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

export interface GuardarProyeccionInput extends SemanaQuery {
  tipo: TipoProyeccion
  registros: { fecha?: string; cliente?: string; pais?: string; frutaId?: number; jabas: number }[]
}
