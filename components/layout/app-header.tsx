import { Suspense } from "react"
import Link from "next/link"
import { Skeleton } from "@/components/ui/skeleton"
import { getCurrentUser } from "@/lib/auth/session"
import { MainNav } from "./main-nav"
import { ModeToggle } from "./mode-toggle"
import { navItemsFor } from "./nav-items"
import { UserMenu } from "./user-menu"
import { BrandLogo } from "./brand-logo"

/** Partes del header que dependen de la sesión (cookies → se resuelven por request). */
async function SessionNav() {
  const user = await getCurrentUser()
  return (
    <>
      <MainNav items={navItemsFor(user.rol)} />
      <UserMenu user={user} />
    </>
  )
}

export function AppHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/80">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4 sm:px-6">
        <Link href="/" className="flex shrink-0 items-center">
          <BrandLogo className="h-10 w-auto text-black dark:text-white sm:h-11" />
          <span className="sr-only">Pura Fruit · Plan de Packing</span>
        </Link>
        <Suspense fallback={<Skeleton className="h-8 flex-1" />}>
          <SessionNav />
        </Suspense>
        <ModeToggle />
      </div>
    </header>
  )
}
