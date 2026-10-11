import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"

export function ConfiguracionSkeleton() {
  return (
    <div aria-busy="true" aria-label="Cargando configuración de planta" className="flex flex-col gap-6">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-9 w-80 max-w-full" />
          <Skeleton className="h-4 w-[36rem] max-w-full" />
        </div>
        <Skeleton className="h-11 w-80 max-w-full rounded-full" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_23rem]">
        <div className="flex flex-col gap-6">
          {[2, 3, 2].map((campos, i) => (
            <Card key={i}>
              <CardContent className="flex flex-col gap-4">
                <Skeleton className="h-6 w-56" />
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {Array.from({ length: campos }, (_, j) => (
                    <Skeleton key={j} className="h-20" />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        <Skeleton className="h-96" />
      </div>
    </div>
  )
}
