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

import { getPlanSemanalData } from "../../queries"

const query = { plantaId: 1, frutaId: 1, anio: 2026, semana: 42 }

beforeEach(() => {
  vi.resetAllMocks()
  repos.plantas.getById.mockResolvedValue({})
  repos.frutas.getById.mockResolvedValue({})
  repos.planes.getVigente.mockResolvedValue(null)
})

describe("Carga del planificador", () => {
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
})
