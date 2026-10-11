import { CalendarDays, ChevronDown } from "lucide-react"
import { useTransition } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import type { DashboardData, DashboardPlant } from "../schema"
import { dashboardWeekOptions, resolveDashboardWeek } from "../week-selection"

interface DashboardHeaderProps {
  year: number
  week: number
  period: string
  plants: DashboardData["plants"]
  selectedPlant: DashboardPlant
  onPlantChange: (id: string) => void
}

/** Un único contexto de semana y planta para todo el dashboard. */
export function DashboardHeader({ year, week, period, plants, selectedPlant, onPlantChange }: DashboardHeaderProps) {
  const router = useRouter()
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [isPending, startTransition] = useTransition()
  const years = [year - 1, year, year + 1].filter(value => value >= 2000 && value <= 2100)
  const selectWeek = (value: string) => {
    const [selectedYear, selectedWeek] = value.split("-")
    const params = new URLSearchParams(searchParams.toString())
    params.set("anio", selectedYear)
    params.set("semana", selectedWeek)
    startTransition(() => router.push(`${pathname}?${params}`, { scroll: false }))
  }
  const goToCurrentWeek = () => {
    const current = resolveDashboardWeek({})
    selectWeek(`${current.year}-${current.week}`)
  }

  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="space-y-2">
        <h1 className="font-heading text-3xl leading-tight font-bold sm:text-[34px]">Dashboard de packing</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 text-sm">
          <div className={`group relative -ml-2 inline-flex min-h-10 items-center gap-3 rounded-lg border border-border/60 bg-card px-3 py-2 text-muted-foreground transition-colors hover:border-primary/30 hover:bg-muted/50 focus-within:outline-2 focus-within:outline-offset-2 focus-within:outline-ring ${isPending ? "opacity-60" : ""}`}>
            <CalendarDays size={15} aria-hidden className="shrink-0" />
            <span className="font-semibold whitespace-nowrap text-foreground">Semana {week}</span>
            <span aria-hidden className="text-border">/</span>
            <span className="whitespace-nowrap">{period}</span>
            <ChevronDown size={14} aria-hidden className="ml-1 shrink-0 transition-colors group-hover:text-foreground" />
            <select id="dashboard-week" aria-label="Seleccionar semana del dashboard"
              value={`${year}-${week}`} disabled={isPending}
              onChange={event => selectWeek(event.target.value)}
              className="absolute inset-0 size-full cursor-pointer opacity-0 disabled:cursor-wait">
              {years.map(optionYear => <optgroup key={optionYear} label={String(optionYear)}>
                {dashboardWeekOptions(optionYear).map(option => <option key={option.value} value={option.value}>{option.label}</option>)}
              </optgroup>)}
            </select>
          </div>
          {isPending && <span role="status" className="text-xs text-muted-foreground">Cargando semana…</span>}
          <button type="button" onClick={goToCurrentWeek} disabled={isPending}
            aria-label="Ir a la semana actual" title="Ir a la semana actual según la fecha de Lima"
            className="inline-flex min-h-9 cursor-pointer items-center gap-1.5 rounded-full bg-success px-3 py-1.5 text-xs font-semibold text-success-foreground transition-colors hover:bg-success/80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring disabled:cursor-wait disabled:opacity-60">
            <span aria-hidden className="size-1.5 rounded-full bg-current" />
            Semana en curso
          </button>
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
