"use client"

import { useState, useTransition } from "react"
import { Save } from "lucide-react"
import { toast } from "sonner"
import { AREA_LABEL } from "@/components/shared/areas"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Field, FieldError, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { Spinner } from "@/components/ui/spinner"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import { AREAS, type AreaCodigo, type RegistroInput, type TipoRegistro } from "@/lib/domain"
import { formatInt } from "@/lib/format"
import { registrarEnJornadaAction } from "../actions"
import { horaFin } from "../lib/jornada"

const TIPOS: Record<TipoRegistro, { label: string; ayuda: string }> = {
  AVANCE: {
    label: "Avance de volumen",
    ayuda:
      "Cuánta fruta llegó y cuánto se procesó hasta ahora (acumulado). Con esto el sistema calcula el ritmo real.",
  },
  PERSONAL: {
    label: "Cambio de personal",
    ayuda: "Llegan más personas o se retiran de un área.",
  },
  VOLUMEN: {
    label: "Cambio de volumen del día",
    ayuda: "Cosecha avisa que el total del día será distinto al proyectado.",
  },
}

/** Píldora táctil: oscura cuando está elegida. */
export const CHIP =
  "h-11 rounded-full border border-input px-4 text-sm font-semibold data-[state=on]:border-foreground data-[state=on]:bg-foreground data-[state=on]:text-background"

const NUMERO = "h-12 text-lg tabular-nums md:text-lg"

interface RegistroFormProps {
  jornadaId: number
  horaSugerida: string
  /** Acumulados del último avance, como referencia. */
  ultimoAvance: { recibidas: number; procesadas: number } | null
  meta: number
}

type Campo = "hora" | "recibidas" | "procesadas" | "cantidad" | "volumen"

/** Campo al que se refiere un error del servidor, para mostrarlo junto a él. */
function campoDelError(mensaje: string, tipo: TipoRegistro): Campo | null {
  if (/hora/i.test(mensaje)) return "hora"
  if (tipo === "AVANCE") return /recibidas/i.test(mensaje) ? "recibidas" : "procesadas"
  if (tipo === "PERSONAL") return "cantidad"
  return "volumen"
}

function aNumero(valor: string): number {
  return valor.trim() === "" ? Number.NaN : Number(valor)
}

/** "Registrar en la jornada": avance, cambio de personal o cambio de volumen. */
export function RegistroForm({ jornadaId, horaSugerida, ultimoAvance, meta }: RegistroFormProps) {
  const [tipo, setTipo] = useState<TipoRegistro>("AVANCE")
  const [hora, setHora] = useState(horaSugerida)
  const [recibidas, setRecibidas] = useState("")
  const [procesadas, setProcesadas] = useState("")
  const [sentido, setSentido] = useState<"LLEGAN" | "SALEN">("LLEGAN")
  const [cantidad, setCantidad] = useState("")
  const [area, setArea] = useState<AreaCodigo>("PACKING")
  const [volumen, setVolumen] = useState("")
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()
  const campoError = error ? campoDelError(error, tipo) : null
  /** Props de error para el input de un campo y su mensaje debajo. */
  const invalido = (campo: Campo) =>
    campoError === campo ? { "aria-invalid": true, "aria-describedby": `registro-error-${campo}` } : {}
  const mensaje = (campo: Campo) =>
    campoError === campo ? <FieldError id={`registro-error-${campo}`}>{error}</FieldError> : null

  const entrada = (): RegistroInput => {
    if (tipo === "AVANCE") {
      return {
        tipo,
        hora,
        jabasRecibidasAcum: aNumero(recibidas),
        jabasProcesadasAcum: aNumero(procesadas),
      }
    }
    if (tipo === "PERSONAL") {
      const n = aNumero(cantidad)
      return { tipo, hora, area, cambioPersonal: sentido === "LLEGAN" ? n : -n }
    }
    return { tipo, hora, jabasEsperadasDia: aNumero(volumen) }
  }

  const guardar = (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    startTransition(async () => {
      const res = await registrarEnJornadaAction(jornadaId, entrada())
      if (!res.ok) {
        setError(res.error)
        return
      }
      toast.success("Registro guardado", { description: "El estimado ya está actualizado." })
      setRecibidas("")
      setProcesadas("")
      setCantidad("")
      setVolumen("")
      setHora(horaFin(hora, 1))
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="font-heading text-xl">Registrar en la jornada</CardTitle>
        <CardDescription>{TIPOS[tipo].ayuda}</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={guardar} className="flex flex-col gap-5" noValidate>
          <ToggleGroup
            type="single"
            value={tipo}
            onValueChange={(v) => {
              if (v) {
                setTipo(v as TipoRegistro)
                setError(null)
              }
            }}
            aria-label="Tipo de registro"
            className="w-full flex-wrap"
          >
            {(Object.keys(TIPOS) as TipoRegistro[]).map((t) => (
              <ToggleGroupItem key={t} value={t} className={CHIP}>
                {TIPOS[t].label}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field>
              <FieldLabel htmlFor="registro-hora">Hora</FieldLabel>
              <Input
                id="registro-hora"
                type="time"
                value={hora}
                onChange={(e) => setHora(e.target.value)}
                className={NUMERO}
                required
                {...invalido("hora")}
              />
              {mensaje("hora")}
            </Field>

            {tipo === "AVANCE" ? (
              <>
                <Field>
                  <FieldLabel htmlFor="registro-recibidas">Jabas recibidas (acum.)</FieldLabel>
                  <Input
                    id="registro-recibidas"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={recibidas}
                    onChange={(e) => setRecibidas(e.target.value)}
                    placeholder={ultimoAvance ? `último ${formatInt(ultimoAvance.recibidas)}` : undefined}
                    className={NUMERO}
                    {...invalido("recibidas")}
                  />
                  {mensaje("recibidas")}
                </Field>
                <Field>
                  <FieldLabel htmlFor="registro-procesadas">Jabas procesadas (acum.)</FieldLabel>
                  <Input
                    id="registro-procesadas"
                    type="number"
                    inputMode="numeric"
                    min={0}
                    value={procesadas}
                    onChange={(e) => setProcesadas(e.target.value)}
                    placeholder={ultimoAvance ? `último ${formatInt(ultimoAvance.procesadas)}` : undefined}
                    className={NUMERO}
                    {...invalido("procesadas")}
                  />
                  {mensaje("procesadas")}
                </Field>
              </>
            ) : null}

            {tipo === "PERSONAL" ? (
              <Field>
                <FieldLabel htmlFor="registro-cantidad">Personas</FieldLabel>
                <Input
                  id="registro-cantidad"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={cantidad}
                  onChange={(e) => setCantidad(e.target.value)}
                  className={NUMERO}
                  {...invalido("cantidad")}
                />
                {mensaje("cantidad")}
              </Field>
            ) : null}

            {tipo === "VOLUMEN" ? (
              <Field>
                <FieldLabel htmlFor="registro-volumen">Jabas esperadas en el día</FieldLabel>
                <Input
                  id="registro-volumen"
                  type="number"
                  inputMode="numeric"
                  min={1}
                  value={volumen}
                  onChange={(e) => setVolumen(e.target.value)}
                  placeholder={`meta ${formatInt(meta)}`}
                  className={NUMERO}
                  {...invalido("volumen")}
                />
                {mensaje("volumen")}
              </Field>
            ) : null}
          </div>

          {tipo === "PERSONAL" ? (
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <span id="registro-sentido" className="text-sm font-medium">
                  ¿Llegan o salen?
                </span>
                <ToggleGroup
                  type="single"
                  value={sentido}
                  onValueChange={(v) => v && setSentido(v as "LLEGAN" | "SALEN")}
                  aria-labelledby="registro-sentido"
                  className="flex-wrap"
                >
                  <ToggleGroupItem value="LLEGAN" className={CHIP}>
                    Llegan
                  </ToggleGroupItem>
                  <ToggleGroupItem value="SALEN" className={CHIP}>
                    Salen
                  </ToggleGroupItem>
                </ToggleGroup>
              </div>
              <div className="flex flex-col gap-2">
                <span id="registro-area" className="text-sm font-medium">
                  Área
                </span>
                <ToggleGroup
                  type="single"
                  value={area}
                  onValueChange={(v) => v && setArea(v as AreaCodigo)}
                  aria-labelledby="registro-area"
                  className="w-full flex-wrap"
                >
                  {AREAS.map((a) => (
                    <ToggleGroupItem key={a} value={a} className={CHIP}>
                      {AREA_LABEL[a]}
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>
            </div>
          ) : null}

          {error && !campoError ? <FieldError>{error}</FieldError> : null}

          <Button type="submit" size="lg" className="h-12 self-start px-6 text-base" disabled={isPending}>
            {isPending ? <Spinner data-icon="inline-start" /> : <Save data-icon="inline-start" aria-hidden />}
            Guardar registro
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
