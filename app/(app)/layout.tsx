import { AppHeader } from "@/components/layout/app-header"

/*
 * Sin `await getCurrentUser()` aquí: con Cache Components, leer la sesión
 * (cookies + GET /users/me) fuera de un <Suspense> bloquea el static shell de
 * todas las rutas. El header y cada página ya la piden dentro de su propio
 * <Suspense>, y `getCurrentUser` redirige a /login si no hay sesión.
 */
export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-full flex-1 flex-col">
      <AppHeader />
      <main className="mx-auto flex w-full max-w-7xl flex-1 flex-col gap-6 px-4 py-6 sm:px-6 sm:py-8">
        {children}
      </main>
    </div>
  )
}
