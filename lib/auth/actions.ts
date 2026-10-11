"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { z } from "zod"
import type { ActionResult } from "@/lib/action-result"
import { HOME_POR_ROL } from "@/components/layout/nav-items"
import { serverEnv } from "@/lib/config/env"
import type { Rol } from "@/lib/domain"
import { DEMO_ROL_COOKIE, isRol } from "./session"

/** Selector "Ver como" de la demo: guarda el rol y lleva a su pantalla principal. */
export async function cambiarRolDemoAction(rol: string) {
  if (!isRol(rol)) return
  ;(await cookies()).set(DEMO_ROL_COOKIE, rol, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  redirect(HOME_POR_ROL[rol])
}

const credencialesSchema = z.object({
  email: z.string().trim().min(1).email(),
  password: z.string().min(1),
})

function apiUrl(path: string): URL {
  return new URL(`api/${path}`, serverEnv().API_URL.replace(/\/?$/, "/"))
}

/**
 * Login contra Better Auth (`POST /api/auth/sign-in/email`). El back expone el token
 * de sesión en el header `set-auth-token` (plugin `bearer`); se guarda en la cookie
 * propia del front y de ahí en adelante `apiRequest` lo manda como `Authorization: Bearer`.
 */
export async function loginAction(input: {
  email: string
  password: string
}): Promise<ActionResult<{ redirectTo: string }>> {
  const parsed = credencialesSchema.safeParse(input)
  if (!parsed.success) return { ok: false, error: "Correo o contraseña inválidos." }

  let signInRes: Response
  try {
    signInRes = await fetch(apiUrl("auth/sign-in/email"), {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Origin: serverEnv().APP_URL,
      },
      body: JSON.stringify(parsed.data),
      signal: AbortSignal.timeout(serverEnv().API_TIMEOUT_MS),
    })
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." }
  }

  if (!signInRes.ok) {
    const payload = (await signInRes.json().catch(() => null)) as { message?: string } | null
    return {
      ok: false,
      error:
        signInRes.status === 401
          ? "Correo o contraseña incorrectos."
          : (payload?.message ?? "No se pudo iniciar sesión."),
    }
  }

  const token = signInRes.headers.get("set-auth-token")
  if (!token) return { ok: false, error: "El servidor no devolvió una sesión válida." }

  let meRes: Response
  try {
    meRes = await fetch(apiUrl("users/me"), {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      signal: AbortSignal.timeout(serverEnv().API_TIMEOUT_MS),
    })
  } catch {
    return { ok: false, error: "No se pudo conectar con el servidor." }
  }
  if (!meRes.ok) return { ok: false, error: "No se pudo cargar tu perfil." }
  const actor = (await meRes.json()) as { role: Rol }

  ;(await cookies()).set(serverEnv().AUTH_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24,
  })

  return { ok: true, data: { redirectTo: HOME_POR_ROL[actor.role] } }
}

export async function logoutAction() {
  const store = await cookies()
  const token = store.get(serverEnv().AUTH_COOKIE_NAME)?.value
  if (token) {
    await fetch(apiUrl("auth/sign-out"), {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, Origin: serverEnv().APP_URL },
    }).catch(() => {})
  }
  store.delete(serverEnv().AUTH_COOKIE_NAME)
  redirect("/login")
}
