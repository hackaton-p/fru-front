export type Rol = "ADMIN" | "PLANIFICADOR" | "SUBGERENTE" | "JEFE_TURNO"

export interface Usuario {
  id: number
  nombre: string
  rol: Rol
  /** null = ve todas las plantas (subgerente). */
  plantaId: number | null
}
