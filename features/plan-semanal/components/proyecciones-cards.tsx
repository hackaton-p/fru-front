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
import { CommercialFormDialog, HarvestForm } from "./projection-forms"

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
}

/** Proyección de cosecha por día, en jabas (solo lectura). */
export function ProyeccionCosechaCard({ cosecha, query, canImport }: CosechaCardProps) {
  const cosechaFruta = cosecha.filter((row) => row.frutaId === query.frutaId)
  const columns: DataTableColumn<ProyeccionCosechaDia>[] = [
    { id: "fruta", header: "Fruta", cell: (c) => c.fruta ?? "—" },
    { id: "dia", header: "Día", cell: (c) => formatDia(c.fecha), footer: "Total" },
    {
      id: "jabas",
      header: "Jabas proyectadas",
      numeric: true,
      cell: (c) => formatInt(c.jabas),
      footer: formatInt(cosecha.reduce((s, c) => s + c.jabas, 0)),
    },
  ]

  return (
    <ProyeccionCard
      title="3. Proyección de cosecha"
      description="Registrada por Área de cosecha · No editable una vez registrada"
      action={
        canImport
          ? cosechaFruta.length > 0
            ? <Badge variant="secondary">{cosecha.length === cosechaFruta.length ? "Registrada" : "Carga parcial"}</Badge>
            : <ImportExcelDialog tipo="COSECHA" query={query} />
          : undefined
      }
    >
      {canImport && cosechaFruta.length === 0 ? <HarvestForm key={`${query.plantaId}-${query.frutaId}-${query.anio}-${query.semana}-${query.inicio}-${query.fechas?.join(",")}`} query={query} /> : <DataTable
        caption="Proyección de cosecha por día"
        columns={columns}
        rows={cosecha}
        getRowKey={(c) => `${c.frutaId}-${c.fecha}`}
        emptyMessage="Aún no se registra la proyección de cosecha de esta semana."
      />}
    </ProyeccionCard>
  )
}

interface ComercialCardProps {
  comercial: ProyeccionComercialCliente[]
  query: SemanaQuery
  frutas: Fruta[]
  canImport: boolean
}

/** Programa comercial de la semana por cliente, en jabas (solo lectura). */
export function ProgramaComercialCard({ comercial, query, frutas, canImport }: ComercialCardProps) {
  const frutasPendientes = frutas.filter(fruta => !comercial.some(row => row.frutaId === fruta.id))
  const columns: DataTableColumn<ProyeccionComercialCliente>[] = [
    { id: "fruta", header: "Fruta", cell: (c) => c.fruta ?? "—" },
    { id: "cliente", header: "Cliente", cell: (c) => c.cliente, footer: "Total" },
    {
      id: "jabas",
      header: "Jabas semana",
      numeric: true,
      cell: (c) => formatInt(c.jabas),
      footer: formatInt(comercial.reduce((s, c) => s + c.jabas, 0)),
    },
  ]

  return (
    <ProyeccionCard
      title="2. Programa comercial"
      description="Pedido semanal por cliente y fruta · No editable después de registrarlo"
      action={
        canImport
          ? frutasPendientes.length > 0
            ? <div className="flex flex-wrap gap-2">{frutasPendientes.some(fruta => fruta.id === query.frutaId) ? <ImportExcelDialog tipo="COMERCIAL" query={query} /> : null}<CommercialFormDialog query={query} frutas={frutasPendientes} /></div>
            : <Badge variant="secondary">Frutas registradas</Badge>
          : undefined
      }
    >
      <DataTable
        caption="Pedido comercial por cliente y fruta"
        columns={columns}
        rows={comercial}
        getRowKey={(c) => `${c.frutaId}-${c.clienteId}`}
        emptyMessage="Aún no se registra el programa comercial de esta semana."
      />
    </ProyeccionCard>
  )
}
