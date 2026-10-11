import { Suspense } from "react"
import Link from "next/link"
import { Grape } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"
import type { Rol } from "@/lib/domain"
import { MainNav } from "./main-nav"
import { ModeToggle } from "./mode-toggle"
import { navItemsFor } from "./nav-items"

const ROL_LABEL: Record<Rol, string> = {
  PLANIFICADOR: "Planificador",
  SUBGERENTE: "Subgerente",
  JEFE_TURNO: "Jefe de turno",
}

/** Partes del header que dependen de la sesión (cookies → se resuelven por request). */
async function SessionNav() {
  const user = await getCurrentUser()
  return (
    <>
      <MainNav items={navItemsFor(user.rol)} />
      <div className="hidden items-center gap-2 text-sm lg:flex">
        <span className="font-medium">{user.nombre}</span>
        <Badge variant="outline">{ROL_LABEL[user.rol]}</Badge>
      </div>
    </>
  )
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex items-center gap-2 font-heading text-lg font-bold">
          <Grape className="size-5 text-primary" aria-hidden />
          purafruit
          <span className="sr-only">· Plan de Packing</span>
        </Link>
        <Suspense fallback={<Skeleton className="h-8 flex-1" />}>
          <SessionNav />
        </Suspense>
        <ModeToggle />
      </div>
    </header>
  )
}
