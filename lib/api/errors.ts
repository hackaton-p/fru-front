/** Error normalizado de una llamada al API. */
export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
    readonly code?: string,
  ) {
    super(message)
    this.name = "ApiError"
  }

  get isConflict() {
    return this.status === 409
  }

  get isUnauthorized() {
    return this.status === 401 || this.status === 403
  }
}

/** Mensaje apto para mostrar al usuario a partir de cualquier error. */
export function toUserMessage(error: unknown): string {
  if (error instanceof ApiError) {
    if (error.status === 0) return "No se pudo conectar con el servidor. Intenta de nuevo."
    if (error.isUnauthorized) return "No tienes permiso para realizar esta acción."
    if (error.isConflict) {
      if (error.message === "Only one plan can be approved for this plant, fruit and week") return "Ya existe un plan aprobado para esta planta, fruta y semana. Solo se puede aprobar uno."
      if (error.message === "Only unsubmitted or rejected plans can be discarded") return "Solo puedes descartar un plan sin enviar o rechazado."
      if (error.message === "The planning period cannot be modified" || error.message === "The planning week cannot be modified") return "El inicio y los días de un plan guardado no se pueden modificar. Crea otra planificación."
      if (error.message === "Harvest projections must cover every planning day") return "Faltan proyecciones de cosecha para algunos días del período seleccionado."
      if (error.message === "A projection for this plant, fruit, week and type already exists") {
        return "Esta proyección ya está registrada para la planta, fruta y semana seleccionadas. Actualiza la página para verla."
      }
      if (error.message === "Existing customer has a different country") {
        return "El cliente ya está registrado con otro país. Revisa el país ingresado."
      }
      if (error.message === "Import both harvest and commercial projections before planning") {
        return "Sube la proyección de cosecha y el programa comercial para la misma planta, fruta y semana antes de planificar."
      }
      return error.message || "La acción no es válida para el estado actual del plan."
    }
    if (error.message === "Invalid planning period") return "Selecciona de 2 a 6 días de la misma semana, de lunes a sábado. El lunes es obligatorio."
    if (error.message === "New plans must start next week or later") return "Solo puedes crear planificaciones para la próxima semana en adelante."
    if (error.message === "Harvest quantities must be whole crates") return "La proyección de cosecha solo acepta jabas enteras, sin decimales."
    if (error.message === "Duplicate dates or customers in workbook") return "Hay días o clientes repetidos. Revisa los registros antes de guardar."
    if (error.message === "Harvest date is outside the selected ISO week") return "Los días de cosecha deben pertenecer a la semana seleccionada."
    return error.message
  }
  return "Ocurrió un error inesperado."
}
