import { ApiError } from "@/lib/api/errors"
import type { Jornada, JornadaArea, Plan, PlanDia, RegistroAvance } from "@/lib/domain"
import { formatInt } from "@/lib/format"
import type { JornadasRepository } from "../types"
import { cursoMock } from "./curso-data"
import {
  alertasDe,
  estimar,
  fechaHora,
  horaDeJornada,
  horasEntre,
  type ContextoJornada,
  type Evento,
} from "./jornada-calculator"

/*
 * Jornadas en memoria (API_MOCK=true) con las reglas del back (contexto §6
 * JORNADA y REGISTRO_AVANCE). Los días que ya traen ejecución en el reporte de
 * la semana 41 cuentan como cerrados.
 */

const AREA_LABEL: Record<string, string> = {
  PACKING: "Packing",
  ALMACEN: "Almacén",
  TRAZABILIDAD: "Trazabilidad",
  MANTENIMIENTO: "Mantenimiento",
  SANEAMIENTO: "Saneamiento",
}

/** Duración máxima de una jornada desde su inicio, para validar horas. */
const MAX_HORAS_JORNADA = 16

export interface JornadasStore {
  jornadas: Map<string, Jornada>
  ultimoId: number
}

const keyJornada = (planId: number, fecha: string) => `${planId}-${fecha}`
const keyPlan = (p: Plan) => `${p.plantaId}-${p.frutaId}-${p.semana}`
const sum = (xs: number[]) => xs.reduce((s, x) => s + x, 0)

function contexto(plan: Plan, dia: PlanDia): ContextoJornada {
  return {
    meta: dia.jabasMeta,
    horasPlan: dia.horasActualizadas ?? dia.horas,
    trabajadoresPlan: dia.trabajadores,
    parametros: plan.parametrosUsados,
  }
}

function hhmm(fechaHoraLocal: string) {
  return fechaHoraLocal.slice(11, 16)
}

export function crearJornadasMock(
  planes: Map<string, Plan>,
  store: JornadasStore,
  delay: () => Promise<unknown>,
) {
  const planDe = (planId: number) => {
    const plan = [...planes.values()].find((p) => p.id === planId)
    if (!plan) throw new ApiError("Plan no encontrado", 404)
    return plan
  }

  const diaDe = (plan: Plan, fecha: string) => {
    const dia = plan.dias.find((d) => d.fecha === fecha)
    if (!dia) throw new ApiError("El día no pertenece al plan.", 400)
    return dia
  }

  const jornadaDe = (id: number) => {
    const jornada = [...store.jornadas.values()].find((j) => j.id === id)
    if (!jornada) throw new ApiError("Jornada no encontrada", 404)
    return jornada
  }

  const abierta = (id: number) => {
    const jornada = jornadaDe(id)
    if (jornada.estado !== "ABIERTA") throw new ApiError("La jornada ya está cerrada.", 409)
    return jornada
  }

  /** Cerrado: jornada cerrada en el store, o ejecución ya informada en el reporte. */
  const diaCerrado = (plan: Plan, fecha: string) => {
    const jornada = store.jornadas.get(keyJornada(plan.id, fecha))
    if (jornada) return jornada.estado === "CERRADA"
    const curso = cursoMock({
      plantaId: plan.plantaId,
      frutaId: plan.frutaId,
      anio: plan.anio,
      semana: plan.semana,
    })
    return curso?.dias.find((d) => d.fecha === fecha)?.jabasEjecutadas != null
  }

  /** Primer día sin cerrar del plan aprobado o en ejecución más antiguo de la planta. */
  const diaPorEjecutar = (plantaId: number) => {
    const activos = [...planes.values()]
      .filter((p) => p.plantaId === plantaId && (p.estado === "EN_EJECUCION" || p.estado === "APROBADO"))
      .sort((a, b) => a.semana - b.semana)
    for (const plan of activos) {
      const dia = plan.dias.find((d) => !diaCerrado(plan, d.fecha))
      if (dia) return { plan, dia }
    }
    return null
  }

  const guardarPlan = (plan: Plan) => planes.set(keyPlan(plan), plan)

  /** Guarda la jornada con su estimado vigente recalculado. */
  const guardar = (jornada: Omit<Jornada, "estimacion">, plan: Plan): Jornada => {
    const ctx = contexto(plan, diaDe(plan, jornada.fecha))
    const inicio = sum(jornada.areas.map((a) => a.trabajadoresInicio))
    const actualizada = { ...jornada, estimacion: estimar(jornada.horaInicio, inicio, jornada.registros, ctx) }
    store.jornadas.set(keyJornada(plan.id, jornada.fecha), actualizada)
    return actualizada
  }

  const repo: JornadasRepository = {
    async getActual(plantaId) {
      await delay()
      const porEjecutar = diaPorEjecutar(plantaId)
      if (porEjecutar) {
        const { plan, dia } = porEjecutar
        return { plan, dia, jornada: store.jornadas.get(keyJornada(plan.id, dia.fecha)) ?? null }
      }
      // La semana terminó: se muestra el resultado de la última jornada cerrada.
      const ultima = [...store.jornadas.values()]
        .filter((j) => planDe(j.planId).plantaId === plantaId)
        .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
      if (!ultima) return null
      const plan = planDe(ultima.planId)
      return { plan, dia: diaDe(plan, ultima.fecha), jornada: ultima }
    },

    async iniciar(input) {
      await delay()
      const plan = planDe(input.planId)
      const actual = diaPorEjecutar(plan.plantaId)
      if (!actual || actual.plan.id !== plan.id || actual.dia.fecha !== input.fecha) {
        throw new ApiError("Este día no es el que toca ejecutar.", 409)
      }
      if (store.jornadas.has(keyJornada(plan.id, input.fecha))) {
        throw new ApiError("La jornada de este día ya se inició.", 409)
      }
      const dia = actual.dia
      const areas: JornadaArea[] = dia.areas.map((a) => {
        const dato = input.areas.find((x) => x.area === a.area)
        const llegaron = dato?.llegaron ?? 0
        const inician = dato?.inician ?? 0
        if (inician > llegaron) {
          throw new ApiError(`En ${AREA_LABEL[a.area]} inician más personas de las que llegaron.`, 400)
        }
        return {
          area: a.area,
          trabajadoresPlan: a.trabajadoresPlan,
          trabajadoresLlegaron: llegaron,
          trabajadoresInicio: inician,
          trabajadoresPresentes: inician,
        }
      })
      const inicio = sum(areas.map((a) => a.trabajadoresInicio))
      if (inicio < 1) throw new ApiError("Indica con cuántas personas inicias.", 400)

      const p = plan.parametrosUsados
      store.ultimoId += 1
      const jornada = guardar(
        {
          id: store.ultimoId,
          planId: plan.id,
          fecha: dia.fecha,
          estado: "ABIERTA",
          // MVP: la jornada arranca a la hora programada de la planta.
          horaInicio: fechaHora(dia.fecha, p.horaInicio),
          horasEstimadasInicio: dia.jabasMeta / (inicio * p.rendimientoPersonaHora * p.factorEficiencia),
          areas,
          registros: [],
          cierre: null,
        },
        plan,
      )
      if (plan.estado === "APROBADO") guardarPlan({ ...plan, estado: "EN_EJECUCION" })
      return jornada
    },

    async registrar(jornadaId, input) {
      await delay()
      const jornada = abierta(jornadaId)
      const plan = planDe(jornada.planId)
      const dia = diaDe(plan, jornada.fecha)
      const hora = horaDeJornada(jornada.fecha, plan.parametrosUsados.horaInicio, input.hora)
      const t = horasEntre(jornada.horaInicio, hora)
      if (t < 0 || t > MAX_HORAS_JORNADA) {
        throw new ApiError(`La hora debe estar dentro de la jornada (desde las ${hhmm(jornada.horaInicio)}).`, 400)
      }
      const ultimo = jornada.registros.at(-1)
      if (ultimo && hora < ultimo.hora) {
        throw new ApiError(`La hora no puede ser anterior al último registro (${hhmm(ultimo.hora)}).`, 400)
      }

      let areas = jornada.areas
      if (input.tipo === "AVANCE") {
        const previo = jornada.registros.findLast((r) => r.tipo === "AVANCE")
        if (input.jabasRecibidasAcum < 0 || input.jabasProcesadasAcum < 0) {
          throw new ApiError("Las jabas no pueden ser negativas.", 400)
        }
        if (input.jabasProcesadasAcum > input.jabasRecibidasAcum) {
          throw new ApiError("No se pueden procesar más jabas de las recibidas.", 400)
        }
        if (
          previo?.tipo === "AVANCE" &&
          (input.jabasRecibidasAcum < previo.jabasRecibidasAcum ||
            input.jabasProcesadasAcum < previo.jabasProcesadasAcum)
        ) {
          throw new ApiError("Los acumulados no pueden ser menores que en el avance anterior.", 400)
        }
      } else if (input.tipo === "PERSONAL") {
        if (!Number.isInteger(input.cambioPersonal) || input.cambioPersonal === 0) {
          throw new ApiError("Indica cuántas personas llegan o salen.", 400)
        }
        const area = jornada.areas.find((a) => a.area === input.area)
        if (!area) throw new ApiError("Área no válida.", 400)
        if (area.trabajadoresPresentes + input.cambioPersonal < 0) {
          throw new ApiError(
            `En ${AREA_LABEL[area.area]} solo hay ${formatInt(area.trabajadoresPresentes)} personas.`,
            400,
          )
        }
        areas = jornada.areas.map((a) =>
          a.area === input.area
            ? { ...a, trabajadoresPresentes: a.trabajadoresPresentes + input.cambioPersonal }
            : a,
        )
      } else if (!(input.jabasEsperadasDia > 0)) {
        throw new ApiError("Indica las jabas esperadas del día.", 400)
      }

      // El estimado y las alertas se calculan y se guardan con el registro.
      const evento = { ...input, hora } as Evento
      const ctx = contexto(plan, dia)
      const inicio = sum(jornada.areas.map((a) => a.trabajadoresInicio))
      const est = estimar(jornada.horaInicio, inicio, [...jornada.registros, evento], ctx)
      const registro = {
        ...evento,
        id: jornada.registros.length + 1,
        trabajadoresPresentes: est.trabajadoresPresentes,
        horasEstimadas: est.horasEstimadas,
        alertas: alertasDe(evento, jornada.horaInicio, est, ctx),
      } as RegistroAvance

      return guardar({ ...jornada, areas, registros: [...jornada.registros, registro] }, plan)
    },

    async ajustarHoras(jornadaId, input) {
      await delay()
      const jornada = abierta(jornadaId)
      if (!(input.horasActualizadas > 0) || input.horasActualizadas > 24) {
        throw new ApiError("Las horas actualizadas deben estar entre 0 y 24.", 400)
      }
      const plan = planDe(jornada.planId)
      const actualizado: Plan = {
        ...plan,
        dias: plan.dias.map((d) =>
          d.fecha === jornada.fecha
            ? { ...d, horasActualizadas: input.horasActualizadas, motivoAjuste: input.motivoAjuste }
            : d,
        ),
      }
      guardarPlan(actualizado)
      return guardar(jornada, actualizado)
    },

    async cerrar(jornadaId, input) {
      await delay()
      const jornada = abierta(jornadaId)
      const valores = Object.values(input)
      if (valores.some((v) => !Number.isFinite(v) || v < 0)) {
        throw new ApiError("Los valores del cierre no pueden ser negativos.", 400)
      }
      if (!(input.horasTrabajadas > 0)) throw new ApiError("Indica las horas trabajadas.", 400)
      if (input.jabasDescarte > input.jabasProcesadas) {
        throw new ApiError("El descarte no puede superar las jabas procesadas.", 400)
      }
      const plan = planDe(jornada.planId)
      const meta = diaDe(plan, jornada.fecha).jabasMeta
      const cerrada = guardar(
        {
          ...jornada,
          estado: "CERRADA",
          cierre: {
            ...input,
            metaCumplida: input.jabasProcesadas >= meta,
            diferencia: input.jabasProcesadas - meta,
          },
        },
        plan,
      )
      // Cerrar la última jornada de la semana cierra el plan.
      if (plan.dias.every((d) => diaCerrado(plan, d.fecha))) guardarPlan({ ...plan, estado: "CERRADO" })
      return cerrada
    },
  }

  /** Solo demo: borra la última jornada de la planta y deja el día como estaba. */
  async function reiniciarDemo(plantaId: number) {
    await delay()
    const ultima = [...store.jornadas.values()]
      .filter((j) => planDe(j.planId).plantaId === plantaId)
      .sort((a, b) => b.fecha.localeCompare(a.fecha))[0]
    if (!ultima) return
    store.jornadas.delete(keyJornada(ultima.planId, ultima.fecha))
    const plan = planDe(ultima.planId)
    guardarPlan({
      ...plan,
      estado: plan.estado === "CERRADO" ? "EN_EJECUCION" : plan.estado,
      dias: plan.dias.map((d) =>
        d.fecha === ultima.fecha ? { ...d, horasActualizadas: null, motivoAjuste: null } : d,
      ),
    })
  }

  /** Jornada cerrada de un día, para el curso de la semana. */
  function cerradaDe(plan: Plan | undefined, fecha: string) {
    if (!plan) return undefined
    const jornada = store.jornadas.get(keyJornada(plan.id, fecha))
    return jornada?.estado === "CERRADA" ? jornada : undefined
  }

  return { repo, reiniciarDemo, cerradaDe }
}
