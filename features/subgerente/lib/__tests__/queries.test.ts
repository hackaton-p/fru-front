import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
vi.mock("next/navigation", () => ({ notFound: () => { throw new Error("NOT_FOUND") } }))
const repos = vi.hoisted(() => ({
  planes: { getById: vi.fn() },
  plantas: { getById: vi.fn() },
  frutas: { getById: vi.fn() },
}))
vi.mock("@/lib/repositories", () => ({ getRepositories: () => repos }))
import { getPlanDetalleData } from "../../queries"

const user = { id: 1, nombre: "Subgerente", rol: "SUBGERENTE" as const, plantaId: null }

beforeEach(() => {
  vi.resetAllMocks()
  repos.plantas.getById.mockResolvedValue({ id: 1 })
})

describe("Consolidated plan detail", () => {
  it.each([null, undefined])("does not request a fruit when fruitId is %s", async fruitId => {
    repos.planes.getById.mockResolvedValue({ id: 6, plantaId: 1, estado: "PENDIENTE", frutaId: fruitId })
    const data = await getPlanDetalleData(6, user)
    expect(data.fruta).toBeNull()
    expect(repos.frutas.getById.mock.calls.length).toBe(0)
  })

  it("preserves the fruit on a historical plan even when inactive", async () => {
    repos.planes.getById.mockResolvedValue({ id: 6, plantaId: 1, estado: "PENDIENTE", frutaId: 3 })
    const fruit = { id: 3, nombre: "Uva", activo: false, plantaIds: [1] }
    repos.frutas.getById.mockResolvedValue(fruit)
    expect((await getPlanDetalleData(6, user)).fruta).toEqual(fruit)
  })
})
