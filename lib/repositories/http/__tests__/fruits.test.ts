import { beforeEach, expect, it, vi } from "vitest"

vi.mock("server-only", () => ({}))
const request = vi.hoisted(() => vi.fn())
vi.mock("@/lib/api/http-client", () => ({ apiRequest: request }))
import { httpRepositories } from "../index"
import { ApiError } from "@/lib/api/errors"

beforeEach(() => vi.resetAllMocks())

it("loads an inactive fruit directly instead of searching the active catalog", async () => {
  request.mockResolvedValue({ id: 3, name: "Uva", isActive: false, plantIds: [1] })
  await expect(httpRepositories.frutas.getById(3)).resolves.toEqual({
    id: 3, nombre: "Uva", activo: false, plantaIds: [1],
  })
  expect(request).toHaveBeenCalledWith("/fruits/3")
})

it("propagates a genuine API 404", async () => {
  const error = new ApiError("Fruit not found", 404)
  request.mockRejectedValue(error)
  await expect(httpRepositories.frutas.getById(99)).rejects.toBe(error)
})
