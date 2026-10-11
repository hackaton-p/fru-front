import { DataTable, type DataTableColumn } from "@/components/shared/data-table"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import type { Fruta, ProyeccionCosechaDia, ProyeccionComercialCliente, SemanaQuery } from "@/lib/domain"
import { formatDia, formatInt } from "@/lib/format"
import { ImportExcelDialog } from "./import-excel-dialog"
import { CommercialFormDialog, HarvestEditDialog, HarvestForm } from "./projection-forms"

interface ProyeccionCardProps {
  title: string
  description: string
  action?: React.ReactNode
  children: React.ReactNode
}

function ProyeccionCard({ title, description, action, children }: ProyeccionCardProps) {
  return (
    <Card className="min-w-0">
      <CardHeader>
        <CardTitle>{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
        {action ? <CardAction>{action}</CardAction> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
    </Card>
  )
}

interface CosechaCardProps {
  cosecha: ProyeccionCosechaDia[]
  query: SemanaQuery
  canImport: boolean
  planId?: number
}

/** Muestra la cosecha semanal desglosada por fruta y día. */
export function ProyeccionCosechaCard({ cosecha, query, canImport, planId }: CosechaCardProps) {
  const cosechaFruta = cosecha.filter(row => row.frutaId === query.frutaId)
  const columns: DataTableColumn<ProyeccionCosechaDia>[] = [
    { id: "fruta", header: "Fruta", cell: c => c.fruta ?? "—" },
    { id: "dia", header: "Día", cell: c => formatDia(c.fecha), footer: "Total" },
    { id: "jabas", header: "Jabas proyectadas", numeric: true, cell: c => formatInt(c.jabas), footer: formatInt(cosecha.reduce((s, c) => s + c.jabas, 0)) },
  ]
  return (
    <ProyeccionCard
      title="3. Proyección de cosecha"
      description="Registrada por Área de cosecha · Desglosada por fruta y día"
      action={canImport ? cosechaFruta.length > 0
        ? <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Registrada · {cosechaFruta[0]?.fruta ?? `Fruta ${query.frutaId}`}</Badge><ImportExcelDialog tipo="COSECHA" query={query} planId={planId} replace /><HarvestEditDialog query={query} planId={planId} cosecha={cosechaFruta} /></div>
        : <ImportExcelDialog tipo="COSECHA" query={query} planId={planId} /> : undefined}
    >
      {canImport && cosechaFruta.length === 0
        ? <HarvestForm key={`${query.plantaId}-${query.frutaId}-${query.anio}-${query.semana}-${query.inicio}-${query.fechas?.join(",")}`} query={query} planId={planId} />
        : <DataTable caption="Proyección de cosecha por fruta y día" columns={columns} rows={cosecha} getRowKey={c => `${c.frutaId}-${c.fecha}`} emptyMessage="Aún no se registra la proyección de cosecha de esta semana." />}
    </ProyeccionCard>
  )
}

interface ComercialCardProps {
  comercial: ProyeccionComercialCliente[]
  query: SemanaQuery
  frutas: Fruta[]
  canImport: boolean
  planId?: number
}

/** Programa comercial semanal total, agrupado por cliente y fruta. */
export function ProgramaComercialCard({ comercial, query, frutas, canImport, planId }: ComercialCardProps) {
  const fruitOptions = [...frutas]
  for (const row of comercial) {
    if (row.frutaId !== undefined && !fruitOptions.some(fruit => fruit.id === row.frutaId)) {
      fruitOptions.push({ id: row.frutaId, nombre: row.fruta ?? `Fruta ${row.frutaId}` })
    }
  }
  const columns: DataTableColumn<ProyeccionComercialCliente>[] = [
    { id: "fruta", header: "Fruta", cell: c => c.fruta ?? "—" },
    { id: "cliente", header: "Cliente", cell: c => c.cliente, footer: "Total" },
    { id: "jabas", header: "Jabas semana", numeric: true, cell: c => formatInt(c.jabas), footer: formatInt(comercial.reduce((s, c) => s + c.jabas, 0)) },
  ]
  return (
    <ProyeccionCard
      title="2. Programa comercial"
      description="Pedido semanal por cliente y fruta · Un total de jabas para la planta"
      action={canImport ? comercial.length > 0
        ? <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Registrado</Badge><ImportExcelDialog tipo="COMERCIAL" query={query} planId={planId} replace /><CommercialFormDialog query={query} frutas={fruitOptions} planId={planId} initial={comercial} /></div>
        : <div className="flex flex-wrap gap-2"><ImportExcelDialog tipo="COMERCIAL" query={query} planId={planId} /><CommercialFormDialog query={query} frutas={fruitOptions} planId={planId} /></div> : undefined}
    >
      <DataTable caption="Pedido comercial por cliente y fruta" columns={columns} rows={comercial} getRowKey={c => `${c.frutaId}-${c.clienteId}`} emptyMessage="Aún no se registra el programa comercial de esta semana." />
    </ProyeccionCard>
  )
}
