"use client"

import { Button } from "@/components/ui/button"

export default function DashboardError({ reset }: { reset: () => void }) {
  return <section className="rounded-2xl bg-card p-8"><h1 className="font-heading text-2xl font-bold">No se pudo cargar el dashboard</h1><p className="my-4 text-muted-foreground">Intenta nuevamente para consultar los reportes de packing.</p><Button onClick={reset}>Reintentar</Button></section>
}
