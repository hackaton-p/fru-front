import Link from "next/link"
import { ArrowRight, CalendarClock, CircleCheck, Clock } from "lucide-react"
import { StatCard } from "@/components/shared/stat-card"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"
import { cn } from "@/lib/utils"
import { formatDecimal, formatDiaLargo, formatHoras, formatInt, formatPercent, formatRangoFechas } from "@/lib/format"
import { filasCurso, lecturaSemana, resumirCurso, type ResumenCurso } from "../lib/curso"
import type { CursoData } from "../queries"
import { CursoTable } from "./curso-table"
import { PillLink } from "./pill-link"
import { nombrePlanta } from "./planes-list-view"

function CursoKpis({ resumen, rendimientoDefault }: { resumen: ResumenCurso; rendimientoDefault: number }) {
  const r = resumen
  const n = r.cerrados.length
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard
        label="Cumplimiento de jabas"
        value={formatPercent(r.cumplimiento)}
        negative={r.cumplimiento < 1}
        hint={`${formatInt(r.jabasEjecutadas)} de ${formatInt(r.jabasProyectadasCerradas)} (${n} día${n > 1 ? "s" : ""} cerrado${n > 1 ? "s" : ""})`}
      />
      <StatCard
        label="Horas de operación"
        value={formatHoras(r.horasPromedio)}
        hint={`promedio, de ${formatHoras(r.horasMin)} a ${formatHoras(r.horasMax)}`}
      />
      <StatCard
        label="Rendimiento"
        value={formatDecimal(r.rendimiento)}
        hint={`jabas por persona-hora · default ${formatDecimal(rendimientoDefault)}`}
      />
      <StatCard
        label="Personal ejecutado"
        value={formatPercent(r.personalEjecutadoRatio, 0)}
        negative={r.personalEjecutadoRatio < 1}
        hint={`del proyectado (${formatInt(r.personalEjecutado)} de ${formatInt(r.personalProyectado)})`}
      />
      <StatCard
        label="Descarte"
        value={formatPercent(r.descartePromedio)}
        hint={
          r.descarteUltimo > r.descartePromedio
            ? `promedio, subiendo a ${formatPercent(r.descarteUltimo)}`
            : `promedio, último día ${formatPercent(r.descarteUltimo)}`
        }
      />
    </div>
  )
}

function PendientesCard({ data }: { data: CursoData }) {
  const { pendientes, plantas } = data
  const n = pendientes.length
  const nombre = (id: number) => nombrePlanta(plantas.find((p) => p.id === id))

  return (
    <Card className={cn(n > 0 && "ring-2 ring-chart-2")}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-heading text-xl">
          {n > 0 ? (
            <Clock className="size-5 text-warning-foreground" aria-hidden />
          ) : (
            <CircleCheck className="size-5 text-primary" aria-hidden />
          )}
          {n === 0 ? "No hay planes por aprobar" : n === 1 ? "1 plan por aprobar" : `${n} planes por aprobar`}
        </CardTitle>
        <CardDescription>
          {n > 0
            ? `${pendientes.map((p) => `${nombre(p.plantaId)} · semana ${p.semana}`).join(" y ")}.`
            : "Todos los planes enviados ya tienen una decisión."}
        </CardDescription>
      </CardHeader>
      {n > 0 ? (
        <CardContent className="flex flex-col items-start gap-4">
          <p className="text-muted-foreground">
            Mientras no los apruebes, los jefes de turno no pueden ejecutarlos.
          </p>
          <Button asChild>
            <Link href="/subgerente/planes?estado=PENDIENTE">
              Ver planes por aprobar
              <ArrowRight data-icon="inline-end" aria-hidden />
            </Link>
          </Button>
        </CardContent>
      ) : null}
    </Card>
  )
}

/** Subgerente · pestaña Curso de la semana: proyectado vs ejecutado por día. */
export function CursoView({ data }: { data: CursoData }) {
  const { query, plantas, planta, curso } = data
  const resumen = curso ? resumirCurso(curso) : null

  const subtitulo = (() => {
    if (!curso) return null
    const partes = [`Proyectado contra ejecutado, del ${formatRangoFechas(curso.dias.map((d) => d.fecha))}`]
    for (const d of resumen?.enCurso ?? []) partes.push(`El ${formatDiaLargo(d.fecha)} está en curso`)
    partes.push(`Fuente: ${curso.fuente}`)
    return partes.join(" · ")
  })()

  return (
    <>
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="font-heading text-3xl font-bold tracking-tight text-balance">
            Curso de la semana {query.semana} ·{" "}
            <span className="text-primary">{nombrePlanta(planta)}</span>
          </h1>
          {subtitulo ? <p className="text-muted-foreground">{subtitulo}</p> : null}
        </div>
        {plantas.length > 1 ? (
          <nav aria-label="Planta" className="flex flex-wrap gap-2">
            {plantas.map((p) => (
              <PillLink
                key={p.id}
                href={`/subgerente/curso?planta=${p.id}&semana=${query.semana}`}
                active={p.id === planta.id}
                current="true"
              >
                {p.nombre}
              </PillLink>
            ))}
          </nav>
        ) : null}
      </div>

      {curso && resumen ? (
        <>
          <CursoKpis resumen={resumen} rendimientoDefault={planta.rendimientoPersonaHora} />

          <Card>
            <CardHeader>
              <CardTitle className="font-heading text-xl">Proyectado vs ejecutado</CardTitle>
              <CardDescription>
                En coral y con flecha: ejecutado por debajo de lo proyectado. Rendimiento = jabas
                ejecutadas ÷ personal ejecutado ÷ horas.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CursoTable curso={curso} filas={filasCurso(curso, resumen)} />
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[2fr_1fr]">
            <Card>
              <CardHeader>
                <CardTitle className="font-heading text-xl">Lectura de la semana</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="flex max-w-prose flex-col gap-3">
                  {lecturaSemana(curso, resumen, planta.horasJornada).map((texto) => (
                    <li key={texto} className="flex gap-3 text-pretty">
                      <span aria-hidden className="mt-2 size-1.5 shrink-0 rounded-full bg-primary" />
                      <span>{texto}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
            <PendientesCard data={data} />
          </div>
        </>
      ) : (
        <>
          <Empty className="flex-none border border-dashed py-10">
            <EmptyHeader>
              <EmptyMedia variant="icon">
                <CalendarClock />
              </EmptyMedia>
              <EmptyTitle className="font-heading text-xl">Aún no hay jornadas cerradas</EmptyTitle>
              <EmptyDescription>
                {nombrePlanta(planta)} no tiene datos de ejecución para la semana {query.semana}.
                Aparecerán cuando el jefe de turno cierre la primera jornada.
              </EmptyDescription>
            </EmptyHeader>
          </Empty>
          <PendientesCard data={data} />
        </>
      )}
    </>
  )
}
