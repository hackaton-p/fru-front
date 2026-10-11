import { z } from "zod"
import { toUserMessage } from "@/lib/api/errors"

/** Resultado serializable de una Server Action. */
export type ActionResult<T> = { ok: true; data: T } | { ok: false; error: string }

export class ForbiddenError extends Error {
  constructor(message = "No tienes permiso para realizar esta acción.") {
    super(message)
    this.name = "ForbiddenError"
  }
}

/** Ejecuta la lógica de una acción y convierte cualquier error en un mensaje para el usuario. */
export async function runAction<T>(fn: () => Promise<T>): Promise<ActionResult<T>> {
  try {
    return { ok: true, data: await fn() }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { ok: false, error: error.issues[0]?.message ?? "Datos inválidos." }
    }
    if (error instanceof ForbiddenError) return { ok: false, error: error.message }
    console.error(error)
    return { ok: false, error: toUserMessage(error) }
  }
}
