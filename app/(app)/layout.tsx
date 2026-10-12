import { Suspense } from "react"
import { AppHeader } from "@/components/layout/app-header"
import { getCurrentUser } from "@/lib/auth/session"

/** Guardia de sesión: redirige a /login sin bloquear el prerender del resto del layout. */
async function SessionGuard() {
  await getCurrentUser()
  return null
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <Suspense fallback={null}>
        <SessionGuard />
      </Suspense>
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
