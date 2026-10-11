import type { Metric } from "../metrics"

const tones = { success: "text-success-foreground", warning: "text-warning-foreground", danger: "text-destructive" }

export function MetricCard({ metric }: { metric: Metric }) {
  return <article className="flex flex-col gap-0.5 rounded-[20px] bg-card px-5 py-[18px]">
    <h2 className="text-sm text-muted-foreground">{metric.label}</h2>
    <p className="font-heading text-[34px] leading-10 font-bold tabular-nums">{metric.value}</p>
    <p className={`flex items-start gap-1.5 text-[13px] font-semibold ${tones[metric.tone]}`}><span aria-hidden className="mt-1.5 size-2 shrink-0 rounded-full bg-current" />{metric.note}</p>
  </article>
}
