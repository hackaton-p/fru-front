import type { Metadata } from "next"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getCurrentUser } from "@/lib/auth/session"
import { getRepositories } from "@/lib/repositories"
import { cambiarPlantaActiva } from "@/features/perfil/actions"

export const metadata: Metadata = { title: "Perfil de usuario" }

export default async function PerfilPage() {
  const user = await getCurrentUser()
  const allPlants = await getRepositories().plantas.listar()
  const permittedIds = user.plantaIds ?? (user.rol === "ADMIN" || user.rol === "SUBGERENTE" ? undefined : [user.plantaId])
  const plants = permittedIds ? allPlants.filter((plant) => permittedIds.includes(plant.id)) : allPlants
  const activePlant = plants.find((plant) => plant.id === user.plantaId)

  return (
    <section className="mx-auto w-full max-w-2xl space-y-6">
      <div>
        <h1 className="font-heading text-2xl font-bold">Perfil de usuario</h1>
        <p className="text-muted-foreground">Consulta tu cuenta y elige la planta de trabajo.</p>
      </div>
      <Card>
        <CardHeader><CardTitle>{user.nombre}</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <p className="text-sm text-muted-foreground">Rol: {user.rol}</p>
          {plants.length > 1 ? (
            <form action={cambiarPlantaActiva} className="space-y-2">
              <label htmlFor="plantaId" className="text-sm font-medium">Planta activa</label>
              <div className="flex flex-wrap gap-3">
                <select id="plantaId" name="plantaId" defaultValue={user.plantaId ?? ""} className="h-10 min-w-56 rounded-md border bg-background px-3 text-sm">
                  {plants.map((plant) => <option key={plant.id} value={plant.id}>{plant.nombre}</option>)}
                </select>
                <button className="h-10 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground" type="submit">Cambiar planta</button>
              </div>
            </form>
          ) : (
            <p className="text-sm">Planta: {activePlant?.nombre ?? "Sin planta asignada"}</p>
          )}
        </CardContent>
      </Card>
    </section>
  )
}
