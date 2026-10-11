import type {
  CalcularPlanInput,
  CursoSemana,
  EstadoPlan,
  Fruta,
  ImportarProyeccionInput,
  ImportarProyeccionResultado,
  Plan,
  PlanCalculado,
  Planta,
  ProyeccionCosechaDia,
  ProyeccionComercialCliente,
  SemanaQuery,
} from "@/lib/domain"

/*
 * Contratos de acceso a datos, uno por agregado del back.
 * Las features dependen de estas interfaces, nunca de una implementación
 * concreta (HTTP o mock).
 */

export interface PlantasRepository {
  listar(): Promise<Planta[]>
  getById(id: number): Promise<Planta>
}

export interface FrutasRepository {
  getById(id: number): Promise<Fruta>
}

export interface ProyeccionesRepository {
  getCosecha(query: SemanaQuery): Promise<ProyeccionCosechaDia[]>
  getComercial(query: SemanaQuery): Promise<ProyeccionComercialCliente[]>
  importar(input: ImportarProyeccionInput): Promise<ImportarProyeccionResultado>
}

export interface PlanesFiltro {
  estado?: EstadoPlan
  plantaId?: number
}

export interface PlanesRepository {
  /** Planes de todas las semanas, del más reciente al más antiguo. */
  listar(filtro?: PlanesFiltro): Promise<Plan[]>
  getById(id: number): Promise<Plan>
  /** Plan vigente (el más reciente) de la planta, fruta y semana, o null. */
  getVigente(query: SemanaQuery): Promise<Plan | null>
  /** Calcula un plan sin guardarlo. */
  simular(input: CalcularPlanInput): Promise<PlanCalculado>
  /** Guarda el cálculo como plan oficial (BORRADOR). */
  aplicar(input: CalcularPlanInput): Promise<Plan>
  /** BORRADOR → PENDIENTE. */
  enviar(planId: number): Promise<Plan>
  /** PENDIENTE → APROBADO. */
  aprobar(planId: number): Promise<Plan>
  /** PENDIENTE → RECHAZADO; el comentario es obligatorio. */
  rechazar(planId: number, comentario: string): Promise<Plan>
}

export interface CursoRepository {
  /** Proyectado vs ejecutado de la semana, o null si aún no hay jornadas. */
  getSemana(query: SemanaQuery): Promise<CursoSemana | null>
}

export interface Repositories {
  plantas: PlantasRepository
  frutas: FrutasRepository
  proyecciones: ProyeccionesRepository
  planes: PlanesRepository
  curso: CursoRepository
}
