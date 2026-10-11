"use server"

import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { HOME_POR_ROL } from "@/components/layout/nav-items"
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
