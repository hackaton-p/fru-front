import { CalendarDays } from "lucide-react"
import type { DashboardData, DashboardPlant } from "../schema"

interface DashboardHeaderProps {
  week: number
  period: string
  plants: DashboardData["plants"]
  selectedPlant: DashboardPlant
  onPlantChange: (id: string) => void
}

/** Un único contexto de semana y planta para todo el dashboard. */
export function DashboardHeader({ week, period, plants, selectedPlant, onPlantChange }: DashboardHeaderProps) {
  const pending = selectedPlant.days.filter(day => !day.closed)

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl leading-tight font-bold sm:text-[34px]">Dashboard de packing</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays size={15} aria-hidden />
            <span className="font-semibold text-foreground">Semana {week}</span>
            <span aria-hidden className="text-border">/</span>
            <span>{period}</span>
          </p>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-success px-2.5 py-1 text-xs font-semibold text-success-foreground">
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            {pending.length === 1 ? `${pending[0].label} en curso` : pending.length > 1 ? "Semana en curso" : "Semana cerrada"}
          </span>
        </div>
      </div>
      <div role="group" aria-label="Seleccionar planta" className="inline-flex max-w-full flex-wrap gap-1 rounded-full border border-border/60 bg-card p-1">
        {plants.map(plant => (
          <button
            key={plant.id}
            type="button"
            aria-label={plant.label}
            title={plant.label}
            aria-pressed={selectedPlant.id === plant.id}
            onClick={() => onPlantChange(plant.id)}
            className={`min-h-10 rounded-full px-5 text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring ${selectedPlant.id === plant.id ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted hover:text-foreground"}`}
          >
            {plant.name}
          </button>
        ))}
      </div>
    </header>
  )
}
