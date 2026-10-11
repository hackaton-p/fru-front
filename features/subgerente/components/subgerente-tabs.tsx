"use client"

import { usePathname } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { PillLink } from "./pill-link"

/** Pestañas Planes y Curso de la semana, con el contador de planes por aprobar. */
export function SubgerenteTabs({ pendientes }: { pendientes: number | null }) {
  const pathname = usePathname()
  const enCurso = pathname.startsWith("/subgerente/curso")

  return (
    <nav aria-label="Vistas del subgerente" className="flex flex-wrap gap-2">
      <PillLink href="/subgerente/planes" active={!enCurso} size="lg">
        Planes
        {pendientes ? (
          <Badge className="bg-destructive text-background tabular-nums">
            <span aria-hidden>{pendientes}</span>
            <span className="sr-only">
              {pendientes === 1 ? "1 plan por aprobar" : `${pendientes} planes por aprobar`}
            </span>
          </Badge>
        ) : null}
      </PillLink>
      <PillLink href="/subgerente/curso" active={enCurso} size="lg">
        Curso de la semana
      </PillLink>
    </nav>
  )
}
