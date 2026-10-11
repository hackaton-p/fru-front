import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { cn } from "@/lib/utils"

export interface DataTableColumn<T> {
  id: string
  header: React.ReactNode
  cell: (row: T) => React.ReactNode
  /** Contenido de la fila de totales para esta columna. */
  footer?: React.ReactNode
  /** Números alineados a la derecha con cifras tabulares. */
  numeric?: boolean
  className?: string
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[]
  rows: T[]
  getRowKey: (row: T) => string | number
  caption?: string
  emptyMessage?: string
}

/** Tabla de solo lectura tipada sobre Table de shadcn (con scroll horizontal propio). */
export function DataTable<T>({
  columns,
  rows,
  getRowKey,
  caption,
  emptyMessage = "Sin datos para mostrar.",
}: DataTableProps<T>) {
  const hasFooter = rows.length > 0 && columns.some((c) => c.footer !== undefined)
  const align = (col: DataTableColumn<T>) =>
    cn(col.numeric && "text-right tabular-nums", col.className)

  return (
    <Table>
      {caption ? <TableCaption className="sr-only">{caption}</TableCaption> : null}
      <TableHeader>
        <TableRow>
          {columns.map((col) => (
            <TableHead key={col.id} className={align(col)}>
              {col.header}
            </TableHead>
          ))}
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.length === 0 ? (
          <TableRow>
            <TableCell colSpan={columns.length} className="h-16 text-center text-muted-foreground">
              {emptyMessage}
            </TableCell>
          </TableRow>
        ) : (
          rows.map((row) => (
            <TableRow key={getRowKey(row)}>
              {columns.map((col) => (
                <TableCell key={col.id} className={align(col)}>
                  {col.cell(row)}
                </TableCell>
              ))}
            </TableRow>
          ))
        )}
      </TableBody>
      {hasFooter ? (
        <TableFooter>
          <TableRow>
            {columns.map((col) => (
              <TableCell key={col.id} className={align(col)}>
                {col.footer}
              </TableCell>
            ))}
          </TableRow>
        </TableFooter>
      ) : null}
    </Table>
  )
}
