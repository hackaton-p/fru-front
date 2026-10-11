import { DataTable, type DataTableColumn } from "@/components/shared/data-table"
import { EstadoDiaBadge } from "@/components/shared/estado-badges"
import { Progress } from "@/components/ui/progress"
import type { AreaCodigo, PlanDia } from "@/lib/domain"
import { formatDia, formatHoras, formatInt, formatMargen } from "@/lib/format"

/* Tablas por día del plan: la de simulación y la del plan oficial por área. */

const diaColumn: DataTableColumn<PlanDia> = {
  id: "dia",
  header: "Día",
  // Fija al hacer scroll horizontal en pantallas angostas.
  className: "sticky left-0 z-10 bg-card",
  cell: (d) => formatDia(d.fecha),
}

const metaColumn: DataTableColumn<PlanDia> = {
  id: "meta",
  header: "Meta (jabas)",
  numeric: true,
  cell: (d) => formatInt(d.jabasMeta),
}

const horasColumn: DataTableColumn<PlanDia> = {
  id: "horas",
  header: "Horas",
  numeric: true,
  cell: (d) => formatHoras(d.horas),
}

const estadoColumn: DataTableColumn<PlanDia> = {
  id: "estado",
  header: "Estado",
  cell: (d) => <EstadoDiaBadge estado={d.estadoDia} />,
}

function MargenCell({ margen }: { margen: number }) {
  const label = formatMargen(margen)
  return (
    <div className="flex min-w-36 items-center gap-2">
      <Progress
        value={Math.min(100, Math.max(0, margen * 100))}
        aria-label={`Margen para volumen extra ${label}`}
      />
      <span className="w-12 text-right tabular-nums">{label}</span>
    </div>
  )
}

/** Paso 1: trabajadores, horas, margen y estado por día. */
export function SimulacionDiasTable({ dias }: { dias: PlanDia[] }) {
  const columns: DataTableColumn<PlanDia>[] = [
    diaColumn,
    metaColumn,
    {
      id: "trabajadores",
      header: "Trabajadores",
      numeric: true,
      cell: (d) => formatInt(d.trabajadores),
    },
    horasColumn,
    {
      id: "margen",
      header: "Margen para volumen extra",
      cell: (d) => <MargenCell margen={d.margen} />,
    },
    estadoColumn,
  ]
  return (
    <DataTable
      caption="Plan simulado por día"
      columns={columns}
      rows={dias}
      getRowKey={(d) => d.fecha}
    />
  )
}

const AREA_COLUMNS: { area: AreaCodigo; header: string }[] = [
  { area: "PACKING", header: "Packing" },
  { area: "ALMACEN", header: "Almacén" },
  { area: "TRAZABILIDAD", header: "Trazab." },
  { area: "MANTENIMIENTO", header: "Mant." },
  { area: "SANEAMIENTO", header: "Saneam." },
]

const margenColumn: DataTableColumn<PlanDia> = {
  id: "margen",
  header: "Margen extra",
  cell: (d) => <MargenCell margen={d.margen} />,
}

interface PlanAreasTableProps {
  dias: PlanDia[]
  /** Muestra el margen para volumen extra (detalle del subgerente). */
  conMargen?: boolean
}

/** Paso 2: plan oficial con el personal repartido por área. */
export function PlanAreasTable({ dias, conMargen = false }: PlanAreasTableProps) {
  const columns: DataTableColumn<PlanDia>[] = [
    diaColumn,
    metaColumn,
    horasColumn,
    ...(conMargen ? [margenColumn] : []),
    ...AREA_COLUMNS.map(
      ({ area, header }): DataTableColumn<PlanDia> => ({
        id: area,
        header,
        numeric: true,
        cell: (d) => formatInt(d.areas.find((a) => a.area === area)?.trabajadoresPlan ?? 0),
      }),
    ),
    {
      id: "total",
      header: "Personal total",
      numeric: true,
      className: "font-medium",
      cell: (d) => formatInt(d.trabajadores),
    },
    estadoColumn,
  ]
  return (
    <DataTable
      caption="Plan oficial por día y área"
      columns={columns}
      rows={dias}
      getRowKey={(d) => d.fecha}
    />
  )
}
