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
    if (error.message === "Duplicate dates or customers in workbook") return "Hay días o clientes repetidos. Revisa los registros antes de guardar."
    if (error.message === "Harvest date is outside the selected ISO week") return "Los días de cosecha deben pertenecer a la semana seleccionada."
    return error.message
  }
  return "Ocurrió un error inesperado."
}
