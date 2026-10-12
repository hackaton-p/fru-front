import Link from "next/link"
import { ArrowRight, ChartColumn, ClipboardCheck } from "lucide-react"
import { DataTable, type DataTableColumn } from "@/components/shared/data-table"
import { EstadoPlanBadge } from "@/components/shared/estado-badges"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import type { EstadoPlan, Plan, Planta } from "@/lib/domain"
import { formatHoras, formatInt, formatRangoFechas } from "@/lib/format"
import { FILTROS_ESTADO } from "../lib/estados"
import type { PlanesData } from "../queries"
import { PillLink } from "./pill-link"
import { PlanNota } from "./plan-nota"

interface PlanesListViewProps {
  data: PlanesData
  filtro: EstadoPlan | null
}

const RUTA = "/subgerente/planes"

export function nombrePlanta(planta: Planta | undefined) {
  return planta ? `Planta ${planta.nombre}` : "Planta"
}

function AccionPlan({ plan }: { plan: Plan }) {
  if (plan.estado === "PENDIENTE") {
    return (
      <Button asChild>
        <Link href={`${RUTA}/${plan.id}`}>
          <ClipboardCheck data-icon="inline-start" aria-hidden />
          Revisar y aprobar
        </Link>
      </Button>
    )
  }
  if (plan.estado === "EN_EJECUCION") {
    return (
      <Button asChild variant="outline">
        <Link href={`/subgerente/curso?plan=${plan.id}`}>
          <ChartColumn data-icon="inline-start" aria-hidden />
          Ver curso
        </Link>
      </Button>
    )
  }
  return (
    <Button asChild variant="outline">
      <Link href={`${RUTA}/${plan.id}`}>
        Ver detalle
        <ArrowRight data-icon="inline-end" aria-hidden />
      </Link>
    </Button>
  )
}

/** Subgerente · pestaña Planes: lista de planes de todas las plantas con filtro por estado. */
export function PlanesListView({ data, filtro }: PlanesListViewProps) {
  const { planes, plantas } = data
  const planta = (id: number) => plantas.find((p) => p.id === id)
  const cuenta = (estado: EstadoPlan | null) =>
    estado ? planes.filter((p) => p.estado === estado).length : planes.length
  const visibles = filtro ? planes.filter((p) => p.estado === filtro) : planes

  const resumen = [
    `${cuenta("PENDIENTE")} por aprobar`,
    `${cuenta("EN_EJECUCION")} en ejecución`,
    plantas.map((p) => nombrePlanta(p)).join(" y "),
  ].join(" · ")

  const columns: DataTableColumn<Plan>[] = [
    {
      id: "plan",
      header: "Plan",
      cell: (p) => (
        <div className="flex flex-col gap-0.5">
          <Link
            href={`${RUTA}/${p.id}`}
            className="font-semibold underline-offset-4 hover:underline focus-visible:underline"
          >
            {nombrePlanta(planta(p.plantaId))} · Semana {p.semana}
          </Link>
          <span className="text-xs text-muted-foreground">
            <PlanNota plan={p} />
          </span>
          {/* En pantallas angostas, estado y acción van bajo el nombre. */}
          <div className="mt-2 flex flex-wrap items-center gap-2 md:hidden">
            <EstadoPlanBadge estado={p.estado} />
            <AccionPlan plan={p} />
          </div>
        </div>
      ),
    },
    { id: "fechas", header: "Fechas", cell: (p) => formatRangoFechas(p.dias.map((d) => d.fecha)) },
    {
      id: "meta",
      header: "Meta (jabas)",
      numeric: true,
      cell: (p) => formatInt(p.totales.jabasMeta),
    },
    {
      id: "pico",
      header: "Trabajadores (pico)",
      numeric: true,
      cell: (p) => formatInt(p.totales.trabajadoresPico),
    },
    {
      id: "horas",
      header: "Horas",
      numeric: true,
      cell: (p) => formatHoras(p.totales.horasTotal),
    },
    {
      id: "estado",
      header: "Estado",
      className: "hidden md:table-cell",
      cell: (p) => <EstadoPlanBadge estado={p.estado} />,
    },
    {
      id: "accion",
      header: <span className="sr-only">Acción</span>,
      className: "hidden text-right md:table-cell",
      cell: (p) => <AccionPlan plan={p} />,
    },
  ]

  return (
    <>
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight">Planes semanales</h1>
          <p className="text-muted-foreground">{resumen}</p>
        </div>
        <nav aria-label="Filtrar por estado" className="flex flex-wrap gap-2">
          {FILTROS_ESTADO.map(({ estado, label }) => (
            <PillLink
              key={label}
              href={estado ? `${RUTA}?estado=${estado}` : RUTA}
              active={estado === filtro}
              current="true"
            >
              {label}
              <span className="tabular-nums opacity-70">{cuenta(estado)}</span>
            </PillLink>
          ))}
        </nav>
      </div>

      <Card>
        <CardContent>
          <DataTable
            caption="Planes semanales por planta"
            columns={columns}
            rows={visibles}
            getRowKey={(p) => p.id}
            emptyMessage="No hay planes con este estado."
          />
        </CardContent>
      </Card>
    </>
  )
}
