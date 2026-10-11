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
  const url = new URL(path.replace(/^\//, ""), serverEnv().API_URL.replace(/\/?$/, "/"))
  for (const [key, value] of Object.entries(query ?? {})) {
    if (value !== undefined && value !== null) url.searchParams.set(key, String(value))
  }
  return url
}

async function authHeader(): Promise<Record<string, string>> {
  const token = (await cookies()).get(serverEnv().AUTH_COOKIE_NAME)?.value
  return token ? { Authorization: `Bearer ${token}` } : {}
}

async function parseError(res: Response): Promise<ApiError> {
  // NestJS devuelve { statusCode, message: string | string[], error }
  const payload = (await res.json().catch(() => null)) as
    | { message?: string | string[]; error?: string; code?: string }
    | null
  const message = Array.isArray(payload?.message)
    ? payload.message.join(". ")
    : payload?.message ?? res.statusText
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
