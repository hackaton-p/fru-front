import "server-only"
import { serverEnv } from "@/lib/config/env"
import { httpRepositories } from "./http"
import { mockRepositories } from "./mock"
import type { Repositories } from "./types"

export type * from "./types"

/** Punto único de composición: elige la implementación según `API_MOCK`. */
export function getRepositories(): Repositories {
  return serverEnv().API_MOCK ? mockRepositories : httpRepositories
}
