"use client"

import { useState } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet"
import type { NavItem } from "./nav-items"

function useIsActive() {
  const pathname = usePathname()
  return (href: string) => pathname === href || pathname.startsWith(`${href}/`)
}

/** Navegación por rol: botones en escritorio, panel lateral en móvil. */
export function MainNav({ items }: { items: NavItem[] }) {
  const [open, setOpen] = useState(false)
  const isActive = useIsActive()

  return (
    <>
      <nav aria-label="Pantallas por rol" className="hidden flex-1 items-center gap-1 md:flex">
        {items.map((item) => (
          <Button
            key={item.href}
            asChild
            variant={isActive(item.href) ? "secondary" : "ghost"}
          >
            <Link href={item.href} aria-current={isActive(item.href) ? "page" : undefined}>
              {item.label}
            </Link>
          </Button>
        ))}
      </nav>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="ml-auto md:hidden" aria-label="Abrir menú">
            <Menu />
          </Button>
        </SheetTrigger>
        <SheetContent side="left">
          <SheetHeader>
            <SheetTitle>Plan de Packing</SheetTitle>
            <SheetDescription>Pantallas disponibles para tu rol</SheetDescription>
          </SheetHeader>
          <nav aria-label="Pantallas por rol" className="flex flex-col gap-1 px-4">
            {items.map((item) => (
              <Button
                key={item.href}
                asChild
                variant={isActive(item.href) ? "secondary" : "ghost"}
                className="justify-start"
              >
                <Link
                  href={item.href}
                  aria-current={isActive(item.href) ? "page" : undefined}
                  onClick={() => setOpen(false)}
                >
                  {item.label}
                </Link>
              </Button>
            ))}
          </nav>
        </SheetContent>
      </Sheet>
    </>
  )
}
