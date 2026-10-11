"use client"

import { useActionState, useState } from "react"
import { FileSpreadsheet } from "lucide-react"
import { useRouter } from "next/navigation"
import { toast } from "sonner"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import type { SemanaQuery, TipoProyeccion } from "@/lib/domain"
import { importarProyeccionAction, type ImportarState } from "../actions"

const TITULO: Record<TipoProyeccion, string> = {
  COSECHA: "Importar proyección de cosecha",
  COMERCIAL: "Importar programa comercial",
}

interface ImportExcelDialogProps {
  tipo: TipoProyeccion
  query: SemanaQuery
  planId?: number
  /** Ya hay una proyección registrada: el archivo la reemplaza. */
  replace?: boolean
}

/** Carga una proyección desde Excel. Si ya existía, la reemplaza. */
export function ImportExcelDialog({ tipo, query, planId, replace = false }: ImportExcelDialogProps) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [, formAction, isPending] = useActionState<ImportarState, FormData>(
    async (prev, formData) => {
      const res = await importarProyeccionAction(prev, formData)
      if (res?.ok) {
        toast.success("Proyección importada", {
          description: res.data.planActualizado ? "La planificación se actualizó con los nuevos datos." : `${res.data.registros} registros cargados.`,
        })
        setOpen(false)
        router.refresh()
      } else if (res) {
        toast.error("No se pudo importar", { description: res.error })
      }
      return res
    },
    null,
  )
  const inputId = `archivo-${tipo}`

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" aria-label={`${TITULO[tipo]} desde Excel`} title={`${TITULO[tipo]} desde Excel`}>
          <FileSpreadsheet aria-hidden />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{TITULO[tipo]}</DialogTitle>
            <DialogDescription>
              Semana {query.semana}, en jabas.{replace ? " El archivo reemplaza la proyección registrada." : ""}{planId ? " Al importar, la planificación se recalcula automáticamente." : ""}
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="tipo" value={tipo} />
          <input type="hidden" name="plantaId" value={query.plantaId} />
          <input type="hidden" name="frutaId" value={query.frutaId} />
          <input type="hidden" name="anio" value={query.anio} />
          <input type="hidden" name="semana" value={query.semana} />
          {query.inicio && <input type="hidden" name="inicio" value={query.inicio} />}
          {query.fechas && <input type="hidden" name="fechas" value={query.fechas.join(",")} />}
          {planId && <input type="hidden" name="planId" value={planId} />}
          <Field>
            <FieldLabel htmlFor={inputId}>Archivo Excel</FieldLabel>
            <Input
              id={inputId}
              name="archivo"
              type="file"
              required
              accept=".xlsx,.xls,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/vnd.ms-excel"
            />
            <FieldDescription>Formatos .xlsx o .xls, hasta 10 MB.</FieldDescription>
          </Field>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="outline">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" disabled={isPending}>
              {isPending ? <Spinner data-icon="inline-start" /> : null}
              Importar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
