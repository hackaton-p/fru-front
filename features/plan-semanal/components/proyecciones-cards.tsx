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
import type { ProyeccionCosechaDia, ProyeccionComercialCliente, SemanaQuery } from "@/lib/domain"
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
  /** Puede registrar o editar la proyección. */
  canImport: boolean
  planId?: number
}

/** Proyección de cosecha por día, en jabas (solo lectura). */
export function ProyeccionCosechaCard({ cosecha, query, canImport, planId }: CosechaCardProps) {
  const columns: DataTableColumn<ProyeccionCosechaDia>[] = [
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
      description="Registrada por Área de cosecha · Editable mientras el plan no se envíe"
      action={
        canImport
          ? cosecha.length > 0
            ? <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Registrada</Badge><ImportExcelDialog tipo="COSECHA" query={query} planId={planId} replace /><HarvestEditDialog query={query} planId={planId} cosecha={cosecha} /></div>
            : <ImportExcelDialog tipo="COSECHA" query={query} planId={planId} />
          : undefined
      }
    >
      {canImport && cosecha.length === 0 ? <HarvestForm key={`${query.plantaId}-${query.frutaId}-${query.anio}-${query.semana}-${query.inicio}-${query.fechas?.join(",")}`} query={query} planId={planId} /> : <DataTable
        caption="Proyección de cosecha por día"
        columns={columns}
        rows={cosecha}
        getRowKey={(c) => c.fecha}
        emptyMessage="Aún no se registra la proyección de cosecha de esta semana."
      />}
    </ProyeccionCard>
  )
}

interface ComercialCardProps {
  comercial: ProyeccionComercialCliente[]
  query: SemanaQuery
  /** Puede registrar o editar el programa. */
  canImport: boolean
  planId?: number
}

/** Programa comercial de la semana por cliente, en jabas (solo lectura). */
export function ProgramaComercialCard({ comercial, query, canImport, planId }: ComercialCardProps) {
  const columns: DataTableColumn<ProyeccionComercialCliente>[] = [
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
      description="Registrado por Área comercial · Editable mientras el plan no se envíe"
      action={
        canImport
          ? comercial.length > 0
            ? <div className="flex flex-wrap items-center gap-2"><Badge variant="secondary">Registrado</Badge><ImportExcelDialog tipo="COMERCIAL" query={query} planId={planId} replace /><CommercialFormDialog query={query} planId={planId} initial={comercial} /></div>
            : <div className="flex flex-wrap gap-2"><ImportExcelDialog tipo="COMERCIAL" query={query} planId={planId} /><CommercialFormDialog query={query} planId={planId} /></div>
          : undefined
      }
    >
      <DataTable
        caption="Programa comercial por cliente"
        columns={columns}
        rows={comercial}
        getRowKey={(c) => c.clienteId}
        emptyMessage="Aún no se registra el programa comercial de esta semana."
      />
    </ProyeccionCard>
  )
}
