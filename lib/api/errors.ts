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
    if (error.isConflict) return error.message || "La acción no es válida para el estado actual del plan."
    return error.message
  }
  return "Ocurrió un error inesperado."
}
