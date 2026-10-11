"use client"

import { useActionState, useState } from "react"
import { FileSpreadsheet } from "lucide-react"
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
}

/** Carga una proyección desde Excel. Las proyecciones son inmutables una vez registradas. */
export function ImportExcelDialog({ tipo, query }: ImportExcelDialogProps) {
  const [open, setOpen] = useState(false)
  const [, formAction, isPending] = useActionState<ImportarState, FormData>(
    async (prev, formData) => {
      const res = await importarProyeccionAction(prev, formData)
      if (res?.ok) {
        toast.success("Proyección importada", {
          description: `${res.data.registros} registros cargados.`,
        })
        setOpen(false)
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
        <Button variant="outline">
          <FileSpreadsheet data-icon="inline-start" aria-hidden />
          Importar Excel
        </Button>
      </DialogTrigger>
      <DialogContent>
        <form action={formAction} className="flex flex-col gap-4">
          <DialogHeader>
            <DialogTitle>{TITULO[tipo]}</DialogTitle>
            <DialogDescription>
              Semana {query.semana}, en jabas. Una vez registrada, la proyección no se puede editar.
            </DialogDescription>
          </DialogHeader>
          <input type="hidden" name="tipo" value={tipo} />
          <input type="hidden" name="plantaId" value={query.plantaId} />
          <input type="hidden" name="frutaId" value={query.frutaId} />
          <input type="hidden" name="semana" value={query.semana} />
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
