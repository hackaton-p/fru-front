import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("@/lib/domain", () => ({
  parametrosDe: () => ({}),
}))

const repos = vi.hoisted(() => ({
  plantas: { getById: vi.fn() },
  frutas: { getById: vi.fn() },
  proyecciones: { getCosecha: vi.fn(), getComercial: vi.fn() },
  planes: { getVigente: vi.fn(), simular: vi.fn() },
}))
vi.mock("@/lib/repositories", () => ({ getRepositories: () => repos }))

import { getPlanSemanalData, resolverSemanaQuery } from "../../queries"

const query = { plantaId: 1, frutaId: 1, anio: 2026, semana: 42 }

beforeEach(() => {
  vi.resetAllMocks()
  repos.plantas.getById.mockResolvedValue({})
  repos.frutas.getById.mockResolvedValue({})
  repos.planes.getVigente.mockResolvedValue(null)
})

describe("Carga del planificador", () => {
  it.each(["2026-10-05", "2026-10-12"])("rechaza fechas antiguas en la URL (%s)", inicio => {
    const data = resolverSemanaQuery({ inicio, anio: "2026", semana: "41", fechas: `${inicio},2026-10-14` }, { id: 1, nombre: "Planificador", rol: "PLANIFICADOR", plantaId: 1 }, new Date("2026-10-12T12:00:00Z"))
    expect(data.inicio).toBe("2026-10-19")
    expect(data.semana).toBe(43)
    expect(data.fechas).toBeUndefined()
  })
  it.each([["2026-10-20", 2], ["2026-10-21", 3], ["2026-10-22", 4], ["2026-10-23", 5], ["2026-10-24", 6]])("resuelve el rango hasta %s con %i días", (fin, cantidadDias) => {
    const fechas = Array.from({ length: cantidadDias }, (_, i) => `2026-10-${19 + i}`)
    const data = resolverSemanaQuery({ inicio: "2026-10-19", fechas: fechas.join(","), dias: "7" }, { id: 1, nombre: "Planificador", rol: "PLANIFICADOR", plantaId: 1 }, new Date("2026-10-11T12:00:00Z"))
    expect(data.inicio).toBe("2026-10-19")
    expect(data.semana).toBe(43)
    expect(data.cantidadDias).toBe(cantidadDias)
    expect(data.fechas).toEqual(fechas)
  })
  it("conserva los días salteados y obtiene la semana desde el lunes", () => {
    const data = resolverSemanaQuery({ inicio: "2026-12-28", fechas: "2027-01-02,2026-12-30,2026-12-28", anio: "2027", semana: "1" }, { id: 1, nombre: "Planificador", rol: "PLANIFICADOR", plantaId: 1 }, new Date("2026-10-11T12:00:00Z"))
    expect(data).toMatchObject({ anio: 2026, semana: 53, cantidadDias: 3, fechas: ["2026-12-28", "2026-12-30", "2027-01-02"] })
  })
  it("no acepta una selección que omite el lunes", () => {
    const data = resolverSemanaQuery({ inicio: "2026-10-19", fechas: "2026-10-20,2026-10-21" }, { id: 1, nombre: "Planificador", rol: "PLANIFICADOR", plantaId: 1 }, new Date("2026-10-11T12:00:00Z"))
    expect(data.fechas).toBeUndefined()
  })
  it.each([
    [[], []],
    [[{ fecha: "2026-10-12", jabas: 100 }], []],
    [[], [{ clienteId: 1, cliente: "Cliente", jabas: 100 }]],
  ])("permite importar sin simular cuando faltan proyecciones (%#)", async (cosecha, comercial) => {
    repos.proyecciones.getCosecha.mockResolvedValue(cosecha)
    repos.proyecciones.getComercial.mockResolvedValue(comercial)

    const data = await getPlanSemanalData(query)

    expect(data.simulacionInicial.resultado.dias).toEqual([])
    expect(data.cosecha).toEqual(cosecha)
    expect(data.comercial).toEqual(comercial)
    expect(repos.planes.simular.mock.calls.length).toBe(0)
  })

  it("no simula automáticamente aunque ambas proyecciones estén cargadas", async () => {
    repos.plantas.getById.mockResolvedValue({ configuradaAt: "2026-10-11T00:00:00Z" })
    repos.proyecciones.getCosecha.mockResolvedValue([{ jabas: 100 }])
    repos.proyecciones.getComercial.mockResolvedValue([{ jabas: 100 }])
    repos.planes.simular.mockResolvedValue({ dias: [] })

    const data = await getPlanSemanalData(query)

    expect(data.simulacionInicial.resultado.dias).toEqual([])
    expect(repos.planes.simular.mock.calls.length).toBe(0)
  })
  it("muestra el plan seleccionado sin sustituirlo por otro de la misma semana", async () => {
    repos.proyecciones.getCosecha.mockResolvedValue([])
    repos.proyecciones.getComercial.mockResolvedValue([])
    const empty = await getPlanSemanalData(query)
    const selected = {
      ...empty.simulacionInicial.resultado,
      id: 7, plantaId: 1, frutaId: 1, anio: 2026, semana: 42,
      estado: "BORRADOR" as const, updatedAt: "2026-10-11T00:00:00Z",
      enviadoAt: null, comentarioAprobacion: null,
    }
    repos.planes.getVigente.mockClear()
    const data = await getPlanSemanalData(query, selected)
    expect(data.plan?.id).toBe(7)
    expect(data.simulacionInicial.resultado).toEqual(selected)
    expect(repos.planes.getVigente.mock.calls.length).toBe(0)
  })
  it("inicia una planificación nueva aunque ya exista otra para esa semana", async () => {
    repos.proyecciones.getCosecha.mockResolvedValue([])
    repos.proyecciones.getComercial.mockResolvedValue([])
    repos.planes.getVigente.mockResolvedValue({ id: 99 })
    const data = await getPlanSemanalData(query, undefined, true)
    expect(data.plan).toBeNull()
    expect(repos.planes.getVigente.mock.calls.length).toBe(0)
  })
})
