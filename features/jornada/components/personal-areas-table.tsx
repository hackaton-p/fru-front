import { AREA_LABEL } from "@/components/shared/areas"
import { DataTable, type DataTableColumn } from "@/components/shared/data-table"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import type { Jornada, JornadaArea } from "@/lib/domain"
import { formatInt } from "@/lib/format"
import { cn } from "@/lib/utils"

function Diferencia({ valor }: { valor: number }) {
  return (
    <span className={cn("font-semibold", valor < 0 ? "text-destructive" : "text-success-foreground")}>
      {valor > 0 ? "+" : valor < 0 ? "−" : ""}
      {formatInt(Math.abs(valor))}
    </span>
  )
}

/** Personal por área durante la jornada: plan, llegaron, iniciaron y ahora. */
export function PersonalAreasTable({ jornada }: { jornada: Jornada }) {
  const total = (campo: keyof Omit<JornadaArea, "area">) =>
    jornada.areas.reduce((s, a) => s + a[campo], 0)

  const columns: DataTableColumn<JornadaArea>[] = [
    {
      id: "area",
      header: "Área",
      className: "font-medium",
      cell: (a) => (
        <div className="flex flex-col">
          <span>{AREA_LABEL[a.area]}</span>
          {/* En el celular, plan, llegaron e iniciaron van bajo el nombre. */}
          <span className="text-xs font-normal text-muted-foreground tabular-nums sm:hidden">
            plan {formatInt(a.trabajadoresPlan)} · llegaron {formatInt(a.trabajadoresLlegaron)} ·
            iniciaron {formatInt(a.trabajadoresInicio)}
          </span>
        </div>
      ),
      footer: "Total",
    },
    {
      id: "plan",
      header: "Plan",
      numeric: true,
      className: "hidden sm:table-cell",
      cell: (a) => formatInt(a.trabajadoresPlan),
      footer: formatInt(total("trabajadoresPlan")),
    },
    {
      id: "llegaron",
      header: "Llegaron",
      numeric: true,
      className: "hidden sm:table-cell",
      cell: (a) => formatInt(a.trabajadoresLlegaron),
      footer: formatInt(total("trabajadoresLlegaron")),
    },
    {
      id: "iniciaron",
      header: "Iniciaron",
      numeric: true,
      className: "hidden sm:table-cell",
      cell: (a) => formatInt(a.trabajadoresInicio),
      footer: formatInt(total("trabajadoresInicio")),
    },
    {
      id: "ahora",
      header: "Ahora",
      numeric: true,
      className: "font-semibold",
      cell: (a) => formatInt(a.trabajadoresPresentes),
      footer: formatInt(total("trabajadoresPresentes")),
    },
    {
      id: "dif",
      header: (
        <>
          <span className="sm:hidden">Dif.</span>
          <span className="hidden sm:inline">Diferencia vs plan</span>
        </>
      ),
      numeric: true,
      cell: (a) => <Diferencia valor={a.trabajadoresPresentes - a.trabajadoresPlan} />,
      footer: <Diferencia valor={total("trabajadoresPresentes") - total("trabajadoresPlan")} />,
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Personal por área</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable
          caption="Personal por área durante la jornada"
          columns={columns}
          rows={jornada.areas}
          getRowKey={(a) => a.area}
        />
      </CardContent>
    </Card>
  )
}
