"use client"

import { useState, useTransition } from "react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Ban, Building2, Leaf, Pencil, Plus, RotateCcw } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import type { Fruta, Planta } from "@/lib/domain"
import type { AdministracionData } from "../queries"
import { desactivarFrutaAction, desactivarPlantaAction, guardarFrutaAction, guardarPlantaAction } from "../actions"

interface CatalogosViewProps { data: AdministracionData }

export function CatalogosView({ data }: CatalogosViewProps) {
  const fruitView = <FruitManager frutas={data.frutas} plantas={data.plantas} />
  if (!data.puedeGestionarPlantas) return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <header className="space-y-2"><h1 className="font-heading text-3xl font-bold tracking-tight">Catálogo de frutas</h1><p className="max-w-2xl text-muted-foreground">Administra las frutas disponibles y las plantas donde se trabajan.</p></header>
    {fruitView}
  </main>

  return <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-8 sm:px-6">
    <header className="space-y-2"><h1 className="font-heading text-3xl font-bold tracking-tight">Administración de catálogos</h1><p className="max-w-2xl text-muted-foreground">Mantén las plantas y frutas disponibles para la operación. Las bajas conservan el historial.</p></header>
    <Tabs defaultValue="plantas" className="gap-5">
      <TabsList aria-label="Catálogos"><TabsTrigger value="plantas"><Building2 aria-hidden />Plantas</TabsTrigger><TabsTrigger value="frutas"><Leaf aria-hidden />Frutas</TabsTrigger></TabsList>
      <TabsContent value="plantas"><PlantManager plantas={data.plantas} /></TabsContent>
      <TabsContent value="frutas">{fruitView}</TabsContent>
    </Tabs>
  </main>
}

function PlantManager({ plantas }: { plantas: Planta[] }) {
  const [editing, setEditing] = useState<Planta | null | undefined>(undefined)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const save = async (form: FormData) => {
    const input = {
      ...(editing ? { id: editing.id } : {}),
      nombre: String(form.get("nombre") ?? ""),
      ...(editing ? { activo: form.get("activo") === "on" } : {}),
    }
    startTransition(async () => {
      const result = await guardarPlantaAction(input)
      if (!result.ok) { toast.error("No se pudo guardar la planta", { description: result.error }); return }
      toast.success(editing ? "Planta actualizada" : "Planta agregada")
      setEditing(undefined)
      router.refresh()
    })
  }
  const deactivate = (plant: Planta) => {
    const action = plant.activo === false ? "reactivar" : "dar de baja"
    if (!window.confirm(`¿Quieres ${action} ${plant.nombre}? Sus planes y registros históricos se conservarán.`)) return
    startTransition(async () => {
      const result = plant.activo === false
        ? await guardarPlantaAction({ ...plant, activo: true })
        : await desactivarPlantaAction(plant.id)
      if (!result.ok) { toast.error("No se pudo actualizar la planta", { description: result.error }); return }
      toast.success(plant.activo === false ? "Planta reactivada" : "Planta dada de baja")
      router.refresh()
    })
  }
  return <Card>
    <CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Plantas</CardTitle><CardDescription>Administra el nombre y los valores iniciales de planificación.</CardDescription></div><Button onClick={() => setEditing(null)} disabled={pending}><Plus aria-hidden />Agregar planta</Button></CardHeader>
    <CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Planta</TableHead><TableHead>Rendimiento</TableHead><TableHead>Personal máximo</TableHead><TableHead>Turno</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>
      {plantas.map((plant) => <TableRow key={plant.id}><TableCell className="font-medium">{plant.nombre}</TableCell><TableCell>{plant.rendimientoPersonaHora} jabas/persona-h</TableCell><TableCell>{plant.personalMaximo}</TableCell><TableCell>{plant.horasJornada} h</TableCell><TableCell><Badge variant={plant.activo === false ? "outline" : "secondary"}>{plant.activo === false ? "Inactiva" : "Activa"}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(plant)} disabled={pending}><Pencil aria-hidden />Editar</Button><Button size="sm" variant="ghost" onClick={() => deactivate(plant)} disabled={pending}>{plant.activo === false ? <RotateCcw aria-hidden /> : <Ban aria-hidden />}{plant.activo === false ? "Reactivar" : "Dar de baja"}</Button></div></TableCell></TableRow>)}
      {plantas.length === 0 && <TableRow><TableCell colSpan={6} className="h-20 text-center text-muted-foreground">No hay plantas registradas.</TableCell></TableRow>}
    </TableBody></Table></div></CardContent>
    <PlantFormDialog key={editing?.id ?? (editing === null ? "new" : "closed")} value={editing ?? null} open={editing !== undefined} pending={pending} onOpenChange={(open) => { if (!open) setEditing(undefined) }} onSave={save} />
  </Card>
}

function PlantFormDialog({ value, open, pending, onOpenChange, onSave }: { value: Planta | null; open: boolean; pending: boolean; onOpenChange: (open: boolean) => void; onSave: (data: FormData) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl"><form action={onSave} className="space-y-5">
    <DialogHeader><DialogTitle>{value ? "Editar planta" : "Agregar planta"}</DialogTitle><DialogDescription>La planta se crea con parámetros sugeridos sin confirmar. Subgerencia podrá revisarlos en Configuración antes de planificar.</DialogDescription></DialogHeader>
    <div className="space-y-2"><Label htmlFor="plant-name">Nombre de la planta</Label><Input id="plant-name" name="nombre" defaultValue={value?.nombre ?? ""} maxLength={255} required autoFocus /></div>
    {value ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="activo" defaultChecked={value.activo !== false} />Planta activa</label> : null}
    <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={pending}>{pending ? "Guardando…" : value ? "Guardar cambios" : "Agregar planta"}</Button></DialogFooter>
  </form></DialogContent></Dialog>
}

function FruitManager({ frutas, plantas }: { frutas: Fruta[]; plantas: Planta[] }) {
  const [editing, setEditing] = useState<Fruta | null | undefined>(undefined)
  const [pending, startTransition] = useTransition()
  const router = useRouter()
  const save = (form: FormData) => {
    const input = { ...(editing ? { id: editing.id } : {}), nombre: String(form.get("nombre") ?? ""), plantaIds: form.getAll("plantaIds").map(Number), activo: editing ? form.get("activo") === "on" : true }
    startTransition(async () => {
      const result = await guardarFrutaAction(input)
      if (!result.ok) { toast.error("No se pudo guardar la fruta", { description: result.error }); return }
      toast.success(editing ? "Fruta actualizada" : "Fruta agregada")
      setEditing(undefined)
      router.refresh()
    })
  }
  const deactivate = (fruit: Fruta) => {
    const action = fruit.activo === false ? "reactivar" : "dar de baja"
    const assignedPlants = (fruit.plantaIds ?? []).filter((id) => plantas.some((plant) => plant.id === id && plant.activo !== false))
    if (fruit.activo === false && assignedPlants.length === 0) {
      setEditing(fruit)
      toast.info("Asigna la fruta a una planta activa para reactivarla.")
      return
    }
    if (!window.confirm(`¿Quieres ${action} ${fruit.nombre}? Los planes y registros históricos se conservarán.`)) return
    startTransition(async () => {
      const result = fruit.activo === false
        ? await guardarFrutaAction({ ...fruit, activo: true, plantaIds: assignedPlants })
        : await desactivarFrutaAction(fruit.id)
      if (!result.ok) { toast.error("No se pudo actualizar la fruta", { description: result.error }); return }
      toast.success(fruit.activo === false ? "Fruta reactivada" : "Fruta dada de baja")
      router.refresh()
    })
  }
  return <Card>
    <CardHeader className="flex-row items-start justify-between gap-4"><div><CardTitle>Frutas</CardTitle><CardDescription>Asigna cada fruta a las plantas donde se procesa.</CardDescription></div><Button onClick={() => setEditing(null)} disabled={pending}><Plus aria-hidden />Agregar fruta</Button></CardHeader>
    <CardContent><div className="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Fruta</TableHead><TableHead>Plantas</TableHead><TableHead>Estado</TableHead><TableHead className="text-right">Acciones</TableHead></TableRow></TableHeader><TableBody>
      {frutas.map((fruit) => <TableRow key={fruit.id}><TableCell className="font-medium">{fruit.nombre}</TableCell><TableCell>{(fruit.plantaIds ?? []).map((id) => plantas.find((plant) => plant.id === id)?.nombre ?? `Planta ${id}`).join(", ") || "Sin plantas"}</TableCell><TableCell><Badge variant={fruit.activo === false ? "outline" : "secondary"}>{fruit.activo === false ? "Inactiva" : "Activa"}</Badge></TableCell><TableCell><div className="flex justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setEditing(fruit)} disabled={pending}><Pencil aria-hidden />Editar</Button><Button size="sm" variant="ghost" onClick={() => deactivate(fruit)} disabled={pending}>{fruit.activo === false ? <RotateCcw aria-hidden /> : <Ban aria-hidden />}{fruit.activo === false ? "Reactivar" : "Dar de baja"}</Button></div></TableCell></TableRow>)}
      {frutas.length === 0 && <TableRow><TableCell colSpan={4} className="h-20 text-center text-muted-foreground">No hay frutas registradas.</TableCell></TableRow>}
    </TableBody></Table></div></CardContent>
    <FruitFormDialog key={editing?.id ?? (editing === null ? "new" : "closed")} value={editing ?? null} open={editing !== undefined} pending={pending} plantas={plantas.filter((plant) => plant.activo !== false)} onOpenChange={(open) => { if (!open) setEditing(undefined) }} onSave={save} />
  </Card>
}

function FruitFormDialog({ value, open, pending, plantas, onOpenChange, onSave }: { value: Fruta | null; open: boolean; pending: boolean; plantas: Planta[]; onOpenChange: (open: boolean) => void; onSave: (data: FormData) => void }) {
  return <Dialog open={open} onOpenChange={onOpenChange}><DialogContent className="max-h-[85vh] overflow-y-auto sm:max-w-lg"><form action={onSave} className="space-y-5">
    <DialogHeader><DialogTitle>{value ? "Editar fruta" : "Agregar fruta"}</DialogTitle><DialogDescription>Selecciona al menos una planta donde estará disponible.</DialogDescription></DialogHeader>
    <div className="space-y-2"><Label htmlFor="fruit-name">Nombre de la fruta</Label><Input id="fruit-name" name="nombre" defaultValue={value?.nombre ?? ""} maxLength={255} required /></div>
    <fieldset className="space-y-3"><legend className="text-sm font-medium">Plantas asociadas</legend><div className="grid gap-2 sm:grid-cols-2">{plantas.map((plant) => <label key={plant.id} className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm"><input type="checkbox" name="plantaIds" value={plant.id} defaultChecked={value?.plantaIds?.includes(plant.id)} />{plant.nombre}</label>)}</div>{plantas.length === 0 && <p className="text-sm text-destructive">Primero debe existir una planta activa.</p>}</fieldset>
    {value ? <label className="flex items-center gap-2 text-sm"><input type="checkbox" name="activo" defaultChecked={value.activo !== false} />Fruta activa</label> : null}
    <DialogFooter><Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button><Button type="submit" disabled={pending || plantas.length === 0}>{pending ? "Guardando…" : value ? "Guardar cambios" : "Agregar fruta"}</Button></DialogFooter>
  </form></DialogContent></Dialog>
}
