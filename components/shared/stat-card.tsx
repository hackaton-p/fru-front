import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface StatCardProps {
  label: string
  value: React.ReactNode
  hint?: React.ReactNode
  /** Resalta el valor como negativo (por ejemplo, un cumplimiento bajo 100%). */
  negative?: boolean
}

/** Indicador clave construido con Card de shadcn. */
export function StatCard({ label, value, hint, negative }: StatCardProps) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardDescription>{label}</CardDescription>
        <CardTitle className={cn("text-2xl tabular-nums", negative && "text-destructive")}>
          {value}
        </CardTitle>
      </CardHeader>
      {hint ? <CardContent className="text-muted-foreground">{hint}</CardContent> : null}
    </Card>
  )
}
