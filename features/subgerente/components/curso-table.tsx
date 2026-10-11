import { ArrowDown } from "lucide-react"
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { CursoSemana } from "@/lib/domain"
import { formatDia } from "@/lib/format"
import { cn } from "@/lib/utils"
import type { CeldaCurso, FilaCurso } from "../lib/curso"

function Celda({ celda, destacada }: { celda: CeldaCurso; destacada?: boolean }) {
  return (
    <TableCell
      className={cn(
        "text-right tabular-nums",
        destacada && "font-semibold",
        celda.bajo && "font-semibold text-destructive",
      )}
    >
      {celda.bajo ? (
        <>
          <ArrowDown className="mr-1 inline size-3.5 align-[-0.125em]" aria-hidden />
          <span className="sr-only">Bajo lo proyectado: </span>
        </>
      ) : null}
      {celda.valor}
    </TableCell>
  )
}

/** Matriz indicador × día del curso de la semana. */
export function CursoTable({ curso, filas }: { curso: CursoSemana; filas: FilaCurso[] }) {
  const columnas = curso.dias.length + 2
  return (
    <Table>
      <TableCaption className="sr-only">Proyectado contra ejecutado por día</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="sticky left-0 z-10 bg-card">Indicador</TableHead>
          {curso.dias.map((d) => (
            <TableHead key={d.fecha} className="text-right">
              {formatDia(d.fecha)}
            </TableHead>
          ))}
          <TableHead className="text-right">Semana</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filas.map((fila, i) =>
          fila.tipo === "seccion" ? (
            <TableRow key={`${i}-${fila.label}`} className="bg-accent hover:bg-accent">
              <TableHead
                scope="colgroup"
                colSpan={columnas}
                className="font-semibold text-accent-foreground"
              >
                {fila.label}
              </TableHead>
            </TableRow>
          ) : (
            <TableRow key={`${i}-${fila.label}`}>
              <TableHead
                scope="row"
                className={cn(
                  "sticky left-0 z-10 bg-card font-normal text-foreground",
                  fila.anidada && "pl-6",
                  fila.destacada && "font-semibold",
                )}
              >
                {fila.label}
              </TableHead>
              {fila.dias.map((celda, j) => (
                <Celda key={curso.dias[j].fecha} celda={celda} destacada={fila.destacada} />
              ))}
              <Celda celda={fila.semana} destacada={fila.destacada} />
            </TableRow>
          ),
        )}
      </TableBody>
    </Table>
  )
}
