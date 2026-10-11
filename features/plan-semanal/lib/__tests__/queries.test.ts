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

    expect(data.simulacionInicial).toBeNull()
    expect(data.cosecha).toEqual(cosecha)
    expect(data.comercial).toEqual(comercial)
    expect(repos.planes.simular.mock.calls.length).toBe(0)
  })

  it("simula cuando ambas proyecciones están cargadas", async () => {
    repos.proyecciones.getCosecha.mockResolvedValue([{ jabas: 100 }])
    repos.proyecciones.getComercial.mockResolvedValue([{ jabas: 100 }])
    repos.planes.simular.mockResolvedValue({ dias: [] })

    const data = await getPlanSemanalData(query)

    expect(data.simulacionInicial?.resultado).toEqual({ dias: [] })
    expect(repos.planes.simular).toHaveBeenCalledWith(expect.objectContaining(query))
  })
})
