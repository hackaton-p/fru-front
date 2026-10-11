"use client"

import { useState } from "react"
import Link from "next/link"
import { Eye, Pencil, Plus } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/shared/data-table"
import { EstadoPlanBadge } from "@/components/shared/estado-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import type { Plan, Planta } from "@/lib/domain"
import { ESTADOS_PLAN } from "@/lib/domain"
import { formatInt, formatRangoFechas } from "@/lib/format"
import { planEditable } from "../lib/plan-comparator"
import { DiscardPlanButton } from "./discard-plan-button"

export function PlanificadorListView({ planes, plantas, canGestionar }: {
  planes: Plan[]; plantas: Planta[]; canGestionar: boolean
}) {
  const [plantId, setPlantId] = useState(plantas.length === 1 ? String(plantas[0].id) : "")
  const [estado, setEstado] = useState("")
  const [search, setSearch] = useState("")
  const name = (id: number) => plantas.find(p => p.id === id)?.nombre ?? `Planta ${id}`
  const sorted = [...planes].sort((a, b) => b.id - a.id)
  const visibles = sorted.filter(p => (!plantId || p.plantaId === Number(plantId)) &&
    (!estado || p.estado === estado) && `${name(p.plantaId)} ${p.semana} ${p.anio} ${p.id}`.toLowerCase().includes(search.toLowerCase()))
  const actions = (p: Plan) => <div className="flex flex-wrap gap-2">
    <Button asChild variant="outline" size="sm"><Link href={`/planificador?vista=detalle&plan=${p.id}`} aria-label={`Ver plan ${p.id}`}><Eye aria-hidden />Ver</Link></Button>
    {canGestionar && planEditable(p) && <Button asChild variant="outline" size="sm"><Link href={`/planificador?vista=editar&plan=${p.id}`} aria-label={`Modificar plan ${p.id}`}><Pencil aria-hidden />Modificar</Link></Button>}
    {canGestionar && ((p.estado === "BORRADOR" && !p.fechaEnvio) || p.estado === "RECHAZADO") && <DiscardPlanButton planId={p.id} />}
  </div>
  const columns: DataTableColumn<Plan>[] = [
    { id: "plan", header: "Planificación", cell: p => <div className="space-y-1"><Link className="font-semibold hover:underline" href={`/planificador?vista=detalle&plan=${p.id}`}>{name(p.plantaId)} · Semana {p.semana}, {p.anio}</Link><p className="text-xs text-muted-foreground">Plan #{p.id}</p><div className="flex flex-wrap gap-2 md:hidden"><EstadoPlanBadge estado={p.estado} />{actions(p)}</div></div> },
    { id: "fechas", header: "Fechas", cell: p => formatRangoFechas(p.dias.map(d => d.fecha)) },
    { id: "meta", header: "Meta (jabas)", numeric: true, cell: p => formatInt(p.totales.jabasMeta) },
    { id: "personal", header: "Personal (pico)", numeric: true, cell: p => formatInt(p.totales.trabajadoresPico) },
    { id: "estado", header: "Estado", className: "hidden md:table-cell", cell: p => <EstadoPlanBadge estado={p.estado} /> },
    { id: "acciones", header: "Acciones", className: "hidden md:table-cell", cell: actions },
  ]
  return <>
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div><h1 className="font-heading text-3xl font-bold tracking-tight">Planificaciones</h1><p className="text-muted-foreground">Gestiona tus planes semanales. Los más recientes aparecen primero.</p></div>
      {canGestionar && plantas.length > 0 && <Button asChild><Link href={`/planificador?vista=crear&planta=${plantId || plantas[0].id}`}><Plus aria-hidden />Agregar planificación</Link></Button>}
    </div>
    <div className="flex flex-wrap gap-3">
      <Input aria-label="Buscar planificación" placeholder="Buscar por planta, semana, año o número" value={search} onChange={e => setSearch(e.target.value)} className="sm:max-w-sm" />
      <select aria-label="Filtrar por planta" value={plantId} onChange={e => setPlantId(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">Todas las plantas</option>{plantas.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
      <select aria-label="Filtrar por estado" value={estado} onChange={e => setEstado(e.target.value)} className="h-9 rounded-md border bg-background px-3 text-sm"><option value="">Todos los estados</option>{ESTADOS_PLAN.map(s => <option key={s} value={s}>{s.replaceAll("_", " ").toLowerCase()}</option>)}</select>
    </div>
    <Card><CardContent><p className="mb-4 text-sm text-muted-foreground">{visibles.length} de {planes.length} planificaciones · Puedes modificar borradores y planes rechazados.</p><DataTable caption="Listado de planificaciones, del más reciente al más antiguo" columns={columns} rows={visibles} getRowKey={p => p.id} emptyMessage={planes.length ? "No hay planificaciones que coincidan con los filtros." : "Aún no hay planificaciones. Agrega la primera para comenzar."} /></CardContent></Card>
  </>
}
