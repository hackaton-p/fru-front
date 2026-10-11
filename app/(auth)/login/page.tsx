import type { Metadata } from "next"
import { LoginForm } from "@/components/auth/login-form"
import { serverEnv } from "@/lib/config/env"

export const metadata: Metadata = { title: "Iniciar sesión" }

export default function LoginPage() {
  return (
    <main className="flex min-h-full flex-1 items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <LoginForm mockMode={serverEnv().API_MOCK} />
      </div>
    </main>
  )
}
