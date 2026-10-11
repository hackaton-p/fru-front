"use client"

import { useRef, useState, useTransition } from "react"
import { Plus, Trash2 } from "lucide-react"
import { toast } from "sonner"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger } from "@/components/ui/dialog"
import { planningDates } from "@/lib/dates"
import { formatDia } from "@/lib/format"
import type { SemanaQuery } from "@/lib/domain"
import { guardarProyeccionAction } from "../actions"
import { distributeHarvest } from "../lib/harvest-distribution"

export function HarvestForm({ query }: { query: SemanaQuery }) {
  const router = useRouter()
  const [total, setTotal] = useState("")
  const dates = planningDates(query)
  const dayCount = dates.length
  const [values, setValues] = useState<string[]>(Array(dayCount).fill(""))
  const [automatic, setAutomatic] = useState(true)
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const clear = () => { setTotal(""); setValues(Array(dayCount).fill("")); setAutomatic(true); setError(null) }
  const changeTotal = (value: string) => {
    if (!/^\d*$/.test(value)) return
    setTotal(value)
    if (automatic || values.every(v => v === "")) {
      setAutomatic(true)
      setValues(value !== "" && Number.isSafeInteger(Number(value)) && Number(value) >= 0
        ? distributeHarvest(Number(value), dayCount).map(String) : Array(dayCount).fill(""))
    }
  }
  const integerKey = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if ([".", ",", "e", "E", "+", "-"].includes(event.key)) event.preventDefault()
  }
  const save = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (total === "" || !Number.isSafeInteger(Number(total)) || values.some(value => !Number.isInteger(Number(value || 0)) || Number(value || 0) < 0 || Number(value || 0) > 1e9)) {
      setError("La cosecha solo acepta jabas enteras, sin decimales."); return
    }
    const sum = values.reduce((s, v) => s + Number(v || 0), 0)
    if (sum !== Number(total)) { setError("El total debe coincidir con la suma de los días. Ajusta los días o limpia el formulario para distribuir de nuevo."); return }
    startTransition(async () => {
      const result = await guardarProyeccionAction({ ...query, tipo: "COSECHA", registros: dates.map((fecha, i) => ({ fecha, jabas: Number(values[i] || 0) })) })
      if (result.ok) { toast.success("Proyección de cosecha guardada"); router.refresh() }
      else setError(result.error)
    })
  }
  return <form onSubmit={save} className="space-y-4">
    <div className="space-y-2"><Label htmlFor="harvest-total">Total semanal (jabas)</Label><Input id="harvest-total" type="number" inputMode="numeric" min="0" max={dayCount * 1e9} step="1" required value={total} onKeyDown={integerKey} onChange={e => changeTotal(e.target.value)} disabled={pending} /><p className="text-sm text-muted-foreground">Ingresa el total en jabas enteras para repartirlo entre los {dayCount} días. Puedes ajustar cada día; el total se actualizará con tus cambios.</p></div>
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{dates.map((date, i) => <div key={date} className="space-y-2"><Label htmlFor={`harvest-${date}`}>{formatDia(date)}</Label><Input id={`harvest-${date}`} type="number" inputMode="numeric" min="0" max="1000000000" step="1" value={values[i]} disabled={pending} placeholder="0" onKeyDown={integerKey} onChange={e => {
      if (!/^\d*$/.test(e.target.value)) return
      const next = [...values]; next[i] = e.target.value; setValues(next); setAutomatic(false)
      setTotal(next.some(v => v !== "") ? String(next.reduce((s, v) => s + Number(v || 0), 0)) : "")
    }} /></div>)}</div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
    <div className="flex gap-2"><Button type="submit" disabled={pending || total === ""}>{pending ? "Guardando…" : "Guardar proyección"}</Button><Button type="button" variant="outline" onClick={clear} disabled={pending}>Limpiar</Button></div>
  </form>
}

type CommercialRow = { cliente: string; pais: string; jabas: string }
const PAISES = ["Perú", "Estados Unidos", "Países Bajos", "España", "Reino Unido", "China", "Canadá", "Chile", "Colombia", "México"]
const EMPTY_ROW: CommercialRow = { cliente: "", pais: "Perú", jabas: "" }

export function CommercialFormDialog({ query }: { query: SemanaQuery }) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [rows, setRows] = useState<CommercialRow[]>([EMPTY_ROW])
  const [pending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)
  const formRef = useRef<HTMLFormElement>(null)
  const focusField = (field: "cliente" | "jabas", index: number) =>
    requestAnimationFrame(() => formRef.current?.querySelector<HTMLInputElement>(`[data-field="${field}-${index}"]`)?.focus())
  const update = (i: number, key: keyof CommercialRow, value: string) => setRows(rows.map((row, index) => index === i ? { ...row, [key]: value } : row))
  const addRow = () => { setRows([...rows, { ...EMPTY_ROW, pais: rows[rows.length - 1]?.pais ?? EMPTY_ROW.pais }]); focusField("cliente", rows.length) }
  const total = rows.reduce((s, row) => s + Number(row.jabas || 0), 0)
  const onKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, field: "cliente" | "jabas", i: number) => {
    if (e.key !== "Enter" || e.nativeEvent.isComposing) return
    if (e.metaKey || e.ctrlKey) return // Ctrl/Cmd+Enter envía el formulario
    e.preventDefault()
    if (field === "cliente") return focusField("jabas", i)
    if (i < rows.length - 1) return focusField("cliente", i + 1)
    if (rows.length < 500 && rows[i].cliente.trim() && rows[i].jabas !== "") addRow()
    else formRef.current?.reportValidity()
  }
  const reset = () => { setRows([EMPTY_ROW]); setError(null); focusField("cliente", 0) }
  return <Dialog open={open} onOpenChange={(o: boolean) => { setOpen(o); if (!o) { setRows([EMPTY_ROW]); setError(null) } }}>
    <DialogTrigger asChild><Button variant="outline" size="icon" aria-label="Agregar registros al programa comercial" title="Agregar registros al programa comercial"><Plus aria-hidden /></Button></DialogTrigger>
    <DialogContent className="flex max-h-[85vh] flex-col gap-4 sm:max-w-2xl" onOpenAutoFocus={(e: Event) => { e.preventDefault(); focusField("cliente", 0) }}>
      <DialogHeader><DialogTitle>Agregar programa comercial</DialogTitle><DialogDescription>Semana {query.semana} de {query.anio}. Los registros no podrán editarse después de guardar.</DialogDescription></DialogHeader>
      <form ref={formRef} className="flex min-h-0 flex-1 flex-col gap-4" onSubmit={e => {
        e.preventDefault(); setError(null)
        startTransition(async () => {
          const result = await guardarProyeccionAction({ ...query, tipo: "COMERCIAL", registros: rows.map(row => ({ cliente: row.cliente.trim(), pais: row.pais, jabas: Number(row.jabas) })) })
          if (result.ok) { toast.success("Programa comercial guardado"); setOpen(false); setRows([EMPTY_ROW]); router.refresh() }
          else setError(result.error)
        })
      }}>
        <fieldset disabled={pending} className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          <div className="grid grid-cols-[1fr_140px_100px_36px] gap-2 px-1 text-xs font-medium text-muted-foreground"><span>Cliente</span><span>País</span><span>Jabas</span><span className="sr-only">Acciones</span></div>
          {rows.map((row, i) => <div key={i} className="grid grid-cols-[1fr_140px_100px_36px] items-center gap-2">
            <Input aria-label={`Cliente ${i + 1}`} data-field={`cliente-${i}`} required maxLength={255} placeholder="Nombre del cliente" autoComplete="off" value={row.cliente} onKeyDown={e => onKeyDown(e, "cliente", i)} onChange={e => update(i, "cliente", e.target.value)} />
            <select aria-label={`País del cliente ${i + 1}`} required value={row.pais} onChange={e => update(i, "pais", e.target.value)} className="h-9 w-full rounded-md border bg-background px-2 text-sm">{PAISES.map(p => <option key={p} value={p}>{p}</option>)}</select>
            <Input aria-label={`Jabas del cliente ${i + 1}`} data-field={`jabas-${i}`} required type="number" inputMode="decimal" min="0" max="1000000000" step="0.01" placeholder="0" value={row.jabas} onKeyDown={e => onKeyDown(e, "jabas", i)} onChange={e => update(i, "jabas", e.target.value)} />
            <Button type="button" variant="ghost" size="icon" aria-label={`Eliminar cliente ${i + 1}`} disabled={rows.length === 1} onClick={() => setRows(rows.filter((_, index) => i !== index))}><Trash2 aria-hidden /></Button>
          </div>)}
          <Button type="button" variant="ghost" size="sm" disabled={rows.length >= 500} onClick={addRow}><Plus aria-hidden />Agregar fila</Button>
        </fieldset>
        <p className="text-xs text-muted-foreground"><kbd className="rounded border px-1">Enter</kbd> pasa al siguiente campo y crea una fila nueva al final · <kbd className="rounded border px-1">Ctrl/⌘</kbd>+<kbd className="rounded border px-1">Enter</kbd> guarda.</p>
        {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
        <div className="flex items-center justify-between gap-2 border-t pt-4">
          <p className="text-sm font-semibold">Total: {total.toLocaleString("es-PE")} jabas · {rows.length} {rows.length === 1 ? "cliente" : "clientes"}</p>
          <div className="flex gap-2"><Button type="button" variant="outline" disabled={pending} onClick={reset}>Limpiar</Button><Button type="submit" disabled={pending}>{pending ? "Guardando…" : "Guardar registros"}</Button></div>
        </div>
      </form>
    </DialogContent>
  </Dialog>
}
