"use client"

import { formatMomento } from "@/lib/format"

/** Fecha y hora en la zona horaria del navegador ("hoy 14:32"). */
export function LocalDateTime({ iso }: { iso: string }) {
  return (
    <time dateTime={iso} suppressHydrationWarning>
      {formatMomento(iso)}
    </time>
  )
}
