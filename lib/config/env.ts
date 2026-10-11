import "server-only"
import { z } from "zod"

const schema = z.object({
  /** URL base del API NestJS. */
  API_URL: z.url().default("http://localhost:3000"),
  /** URL pública de este front. Better Auth exige un Origin confiable en POST /api/auth/*; un fetch servidor-a-servidor no lo manda solo, como sí hace un navegador. */
  APP_URL: z.url().default("http://localhost:3001"),
  /** "true" usa los repositorios mock en memoria en lugar del API. */
  API_MOCK: z
    .enum(["true", "false"])
    .default("true")
    .transform((v) => v === "true"),
  API_TIMEOUT_MS: z.coerce.number().int().positive().default(10_000),
  /** Cookie donde el login guarda el JWT. */
  AUTH_COOKIE_NAME: z.string().min(1).default("access_token"),
})

export type ServerEnv = z.infer<typeof schema>

let cached: ServerEnv | undefined

/** Variables de entorno del servidor, validadas una sola vez. */
export function serverEnv(): ServerEnv {
  cached ??= schema.parse(process.env)
  return cached
}
