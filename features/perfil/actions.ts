"use server"

import { cookies } from "next/headers"
import { revalidatePath } from "next/cache"
import { getCurrentUser, ACTIVE_PLANT_COOKIE } from "@/lib/auth/session"
import { getRepositories } from "@/lib/repositories"

export async function cambiarPlantaActiva(formData: FormData) {
  const plantaId = Number(formData.get("plantaId"))
  if (!Number.isInteger(plantaId) || plantaId < 1) return

  const user = await getCurrentUser()
  const permittedIds = user.plantaIds ?? (user.rol === "ADMIN" || user.rol === "SUBGERENTE" ? undefined : [user.plantaId])
  if (permittedIds && !permittedIds.includes(plantaId)) return
  const plants = await getRepositories().plantas.listar()
  if (!plants.some((plant) => plant.id === plantaId)) return

  ;(await cookies()).set(ACTIVE_PLANT_COOKIE, String(plantaId), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  })
  revalidatePath("/")
}
