import "server-only"
import type { Usuario } from "@/lib/domain"

/**
 * Usuario de la sesión actual.
 * TODO(auth): decodificar el JWT de la cookie (userId, rol, plantaId) cuando
 * exista el login del back. Mientras tanto devuelve un planificador de Piura.
 */
export async function getCurrentUser(): Promise<Usuario> {
  return { id: 1, nombre: "Planificador", rol: "PLANIFICADOR", plantaId: 1 }
}
