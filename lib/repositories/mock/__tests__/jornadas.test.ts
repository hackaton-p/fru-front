import { describe, expect, it } from "vitest"
import { repartirPorArea, type ParametrosPlanta, type Plan } from "@/lib/domain"
import { cursoMock } from "../curso-data"
import { estimar, horaDeJornada, horasEntre } from "../jornada-calculator"
import { crearJornadasMock } from "../jornadas"
import { planesSemilla } from "../planes-semilla"

const PIURA: ParametrosPlanta = {
  rendimientoPersonaHora: 5.9,
  personalMaximo: 300,
  horasJornada: 10,
  horasExtraMax: 2,
  horaInicio: "17:00",
  factorEficiencia: 0.8,
  toleranciaVolumen: 5,
}
const CTX = { meta: 13_000, horasPlan: 9.98, trabajadoresPlan: 276, parametros: PIURA }
const INICIO = "2026-10-09T17:00"

describe("estimar (contexto §4, en la jornada)", () => {
  it("si inician 186 de los 276 planificados, el día sube a ~14.8 h", () => {
    expect(estimar(INICIO, 186, [], CTX).horasEstimadas).toBeCloseTo(14.8, 1)
  })

  it("con el personal del plan cabe en ~10 h", () => {
    expect(estimar(INICIO, 276, [], CTX).horasEstimadas).toBeCloseTo(9.98, 2)
  })

  it("usa el ritmo real desde el primer avance", () => {
    // 2 h con 276 personas = 552 horas-persona; 2,208 jabas → 4 jabas por persona-hora.
    const est = estimar(
      INICIO,
      276,
      [{ tipo: "AVANCE", hora: "2026-10-09T19:00", jabasRecibidasAcum: 2_600, jabasProcesadasAcum: 2_208 }],
      CTX,
    )
    expect(est.ritmoReal).toBe(true)
    expect(est.productividad).toBeCloseTo(4, 5)
    expect(est.horasEstimadas).toBeCloseTo(2 + (13_000 - 2_208) / (276 * 4), 5)
  })

  it("un cambio de personal cambia el equipo y propone ajustar por personal presente", () => {
    const est = estimar(
      INICIO,
      276,
      [{ tipo: "PERSONAL", hora: "2026-10-09T18:00", area: "PACKING", cambioPersonal: -30 }],
      CTX,
    )
    expect(est.trabajadoresPresentes).toBe(246)
    expect(est.motivoSugerido).toBe("PERSONAL_PRESENTE")
  })
})

describe("horaDeJornada", () => {
  it("pasada la medianoche, la hora es del día siguiente", () => {
    expect(horaDeJornada("2026-10-09", "17:00", "01:30")).toBe("2026-10-10T01:30")
    expect(horasEntre(INICIO, "2026-10-10T01:30")).toBe(8.5)
    expect(horaDeJornada("2026-10-09", "17:00", "19:00")).toBe("2026-10-09T19:00")
  })
})

describe("jornadas mock (flujo del jefe de turno)", () => {
  const nuevo = () => {
    const planes = new Map<string, Plan>(
      planesSemilla(new Date("2026-10-10T12:00:00Z")).map((p) => [`${p.plantaId}-${p.frutaId}-${p.semana}`, p]),
    )
    const mock = crearJornadasMock(planes, { jornadas: new Map(), ultimoId: 0 }, async () => {})
    return { planes, ...mock }
  }

  it("toca ejecutar el viernes 09/10 del plan en ejecución de Piura", async () => {
    const { repo } = nuevo()
    const actual = await repo.getActual(1)
    expect(actual?.dia.fecha).toBe("2026-10-09")
    expect(actual?.plan.semana).toBe(41)
    expect(actual?.jornada).toBeNull()
  })

  it("inicia, registra, ajusta y cierra; el último día cierra el plan", async () => {
    const { repo, planes, reiniciarDemo, cerradaDe } = nuevo()
    const { plan, dia } = (await repo.getActual(1))!
    const inicio = { planId: plan.id, fecha: dia.fecha, trabajadores: dia.trabajadores - 20, jabasDia: dia.jabasMeta }
    const reparto = repartirPorArea(dia.areas, inicio.trabajadores)

    const jornada = await repo.iniciar(inicio)
    expect(jornada.estado).toBe("ABIERTA")
    expect(jornada.horaInicio).toBe("2026-10-09T17:00")
    expect(jornada.registros).toHaveLength(0)
    expect(jornada.areas.reduce((s, a) => s + a.trabajadoresInicio, 0)).toBe(inicio.trabajadores)

    await expect(repo.iniciar(inicio)).rejects.toThrow("ya se inició")

    const conAvance = await repo.registrar(jornada.id, {
      tipo: "AVANCE",
      hora: "19:00",
      jabasRecibidasAcum: 2_000,
      jabasProcesadasAcum: 1_800,
    })
    expect(conAvance.registros).toHaveLength(1)
    // Llegaron 2,000 de ~2,600 esperadas en 2 h → alerta de volumen entrante.
    expect(conAvance.registros[0].alertas.map((a) => a.tipo)).toContain("VOLUMEN_ENTRANTE")

    await expect(
      repo.registrar(jornada.id, { tipo: "AVANCE", hora: "18:30", jabasRecibidasAcum: 2_500, jabasProcesadasAcum: 2_000 }),
    ).rejects.toThrow("anterior al último registro")
    await expect(
      repo.registrar(jornada.id, { tipo: "AVANCE", hora: "20:00", jabasRecibidasAcum: 1_500, jabasProcesadasAcum: 1_400 }),
    ).rejects.toThrow("no pueden ser menores")

    const ajustada = await repo.ajustarHoras(jornada.id, {
      horasActualizadas: 11,
      motivoAjuste: "PERSONAL_PRESENTE",
    })
    expect(ajustada.estado).toBe("ABIERTA")
    expect([...planes.values()].find((p) => p.id === plan.id)!.dias.at(-1)!.horasActualizadas).toBe(11)

    const cerrada = await repo.cerrar(jornada.id, {
      horasTrabajadas: 11,
      jabasProcesadas: 12_800,
      jabasDescarte: 1_100,
      kgLoose: 52_000,
      kgFijo: 39_600,
    })
    expect(cerrada.cierre).toMatchObject({ metaCumplida: false, diferencia: -200 })
    expect([...planes.values()].find((p) => p.id === plan.id)!.estado).toBe("CERRADO")

    // El curso del subgerente toma el viernes entero de la jornada cerrada.
    const curso = cursoMock({ plantaId: 1, frutaId: 1, anio: 2026, semana: 41 }, new Date(), (fecha) =>
      cerradaDe(plan, fecha),
    )!
    const viernes = curso.dias.find((d) => d.fecha === dia.fecha)!
    expect(viernes.jabasEjecutadas).toBe(12_800)
    expect(viernes.personalProyectado.PACKING).toBe(dia.areas[0].trabajadoresPlan)
    expect(viernes.personalEjecutado.PACKING).toBe(reparto[0].trabajadores)
    // Iniciaron 20 menos que el plan: cuentan como ausentes.
    expect(viernes.ausentismo).toBeCloseTo(20 / dia.trabajadores, 5)

    // Con la semana terminada, se sigue mostrando el resultado del día.
    expect((await repo.getActual(1))?.jornada?.estado).toBe("CERRADA")

    await reiniciarDemo(1)
    const reiniciado = await repo.getActual(1)
    expect(reiniciado?.jornada).toBeNull()
    expect(reiniciado?.plan.estado).toBe("EN_EJECUCION")
  })

  it("las toneladas distintas a la meta quedan como cambio de volumen al inicio", async () => {
    const { repo } = nuevo()
    const { plan, dia } = (await repo.getActual(1))!
    const jornada = await repo.iniciar({
      planId: plan.id,
      fecha: dia.fecha,
      trabajadores: dia.trabajadores,
      jabasDia: dia.jabasMeta + 1_000,
    })
    expect(jornada.registros).toHaveLength(1)
    expect(jornada.registros[0]).toMatchObject({ tipo: "VOLUMEN", hora: "2026-10-09T17:00" })
    expect(jornada.estimacion.volumenDia).toBe(dia.jabasMeta + 1_000)
  })

  it("no deja iniciar sin trabajadores", async () => {
    const { repo } = nuevo()
    const { plan, dia } = (await repo.getActual(1))!
    await expect(
      repo.iniciar({ planId: plan.id, fecha: dia.fecha, trabajadores: 0, jabasDia: dia.jabasMeta }),
    ).rejects.toThrow("con cuántas personas inicias")
  })
})

describe("repartirPorArea", () => {
  it("reparte en proporción al plan y suma el total", () => {
    const reparto = repartirPorArea(
      [
        { area: "PACKING", trabajadoresPlan: 200 },
        { area: "ALMACEN", trabajadoresPlan: 50 },
        { area: "SANEAMIENTO", trabajadoresPlan: 26 },
      ],
      256,
    )
    expect(reparto.reduce((s, a) => s + a.trabajadores, 0)).toBe(256)
    expect(reparto[0].trabajadores).toBe(186)
  })
})
