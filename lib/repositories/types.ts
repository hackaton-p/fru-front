import type {
  AjusteHorasInput,
  CalcularPlanInput,
  CerrarJornadaInput,
  CursoSemana,
  EstadoPlan,
  Fruta,
  IniciarJornadaInput,
  ImportarProyeccionInput,
  GuardarProyeccionInput,
  ImportarProyeccionResultado,
  Jornada,
  JornadaDelDia,
  RegistroInput,
  ParametrosPlanta,
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
  /** Cambia los valores por defecto. Los planes ya guardados conservan sus `parametrosUsados`. */
  actualizar(id: number, parametros: ParametrosPlanta): Promise<Planta>
}

export interface FrutasRepository {
  getById(id: number): Promise<Fruta>
}

export interface ProyeccionesRepository {
  guardar(input: GuardarProyeccionInput): Promise<ImportarProyeccionResultado>
  getCosecha(query: SemanaQuery): Promise<ProyeccionCosechaDia[]>
  getComercial(query: SemanaQuery): Promise<ProyeccionComercialCliente[]>
  importar(input: ImportarProyeccionInput): Promise<ImportarProyeccionResultado>
}

export interface PlanesFiltro {
  estado?: EstadoPlan
  plantaId?: number
}

export interface PlanesRepository {
  descartar(id: number): Promise<void>
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

export interface JornadasRepository {
  /**
   * Día que toca ejecutar en la planta: el primero sin cerrar del plan aprobado
   * o en ejecución (o el último cerrado, si ya terminó la semana). null si no hay.
   */
  getActual(plantaId: number): Promise<JornadaDelDia | null>
  /** Abre la jornada con lo que llegó e inicia por área. */
  iniciar(input: IniciarJornadaInput): Promise<Jornada>
  /** Avance, cambio de personal o cambio de volumen; recalcula el estimado. */
  registrar(jornadaId: number, input: RegistroInput): Promise<Jornada>
  /** Horas actualizadas del día, con motivo. La meta no cambia. */
  ajustarHoras(jornadaId: number, input: AjusteHorasInput): Promise<Jornada>
  cerrar(jornadaId: number, input: CerrarJornadaInput): Promise<Jornada>
}

export interface Repositories {
  plantas: PlantasRepository
  frutas: FrutasRepository
  proyecciones: ProyeccionesRepository
  planes: PlanesRepository
  curso: CursoRepository
  jornadas: JornadasRepository
}
