import "server-only"
import { cookies } from "next/headers"
import { serverEnv } from "@/lib/config/env"
import { ApiError } from "./errors"


export interface RequestOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE"
  /** Parámetros de query; se omiten los null/undefined. */
  query?: object
  /** Se serializa como JSON. */
  body?: unknown
  /** Para subir archivos (multipart). Tiene prioridad sobre `body`. */
  formData?: FormData
}

function buildUrl(path: string, query?: object) {
  // El back monta todas las rutas bajo /api (ver setGlobalPrefix en application.ts).
  const url = new URL(`api/${path.replace(/^\//, "")}`, serverEnv().API_URL.replace(/\/?$/, "/"))
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
  }
  return url
}

async function authHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get(serverEnv().AUTH_COOKIE_NAME)?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

/** NestJS puede devolver `message` como texto, lista de textos u objeto (p. ej. validaciones por campo). */
function messageText(message: unknown): string | undefined {
  if (typeof message === "string") return message
  if (Array.isArray(message)) return message.map(messageText).filter(Boolean).join(". ")
  if (message && typeof message === "object") {
    const nested = (message as { message?: unknown }).message
    return messageText(nested) ?? JSON.stringify(message)
  }
  return undefined
}

async function parseError(res: Response): Promise<ApiError> {
  // NestJS devuelve { statusCode, message: string | string[] | object, error }
  const payload = (await res.json().catch(() => null)) as
    | { message?: unknown; error?: string; code?: string }
    | null
  const message = messageText(payload?.message) ?? res.statusText
  return new ApiError(message || `Error ${res.status}`, res.status, payload?.code ?? payload?.error)
}

/**
 * Cliente HTTP del API NestJS. Solo corre en el servidor: el token y la URL
 * del API nunca llegan al navegador.
 */
export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = "GET", query, body, formData } = options
  const headers: Record<string, string> = {
    Accept: "application/json",
    ...(await authHeader()),
  }
  if (!formData && body !== undefined) headers["Content-Type"] = "application/json"

  let res: Response
  try {
    res = await fetch(buildUrl(path, query), {
      method,
      headers,
      body: formData ?? (body !== undefined ? JSON.stringify(body) : undefined),
      signal: AbortSignal.timeout(serverEnv().API_TIMEOUT_MS),
    })
  } catch (cause) {
    throw new ApiError(
      cause instanceof Error && cause.name === "TimeoutError"
        ? "El servidor tardó demasiado en responder."
        : "No se pudo conectar con el servidor.",
      0,
    )
  }

  if (!res.ok) throw await parseError(res)
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}
