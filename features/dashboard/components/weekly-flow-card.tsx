"use client"

import { useId, useState } from "react"
import { Boxes, Pause, Play } from "lucide-react"
import { formatInt } from "@/lib/format"
import "./weekly-flow-card.css"

type Summary = { plannedCrates: number; arrivedCrates: number }
// La boca trasera del camión, el puente y la faja comparten este punto.
const UNLOADING_POINT = { x: 263, y: 153 }

/** Bloque isométrico reutilizable: tapa y dos caras con iluminación distinta. */
function Block({ x, y, width = 90, depth = 38, height = 45, color = "var(--border)" }: { x: number; y: number; width?: number; depth?: number; height?: number; color?: string }) {
  return <g transform={`translate(${x} ${y})`}>
    <path d={`M0 0 l${width} 0 ${depth} ${-depth * .5} ${-width} 0 Z`} fill={color} />
    <path d={`M0 0 l${width} 0 0 ${height} ${-width} 0 Z`} fill={color} style={{ filter: "brightness(.88)" }} />
    <path d={`M${width} 0 l${depth} ${-depth * .5} 0 ${height} ${-depth} ${depth * .5} Z`} fill={color} style={{ filter: "brightness(.72)" }} />
    <path d={`M0 0 l${width} 0 ${depth} ${-depth * .5}`} fill="none" stroke="white" strokeOpacity=".7" />
  </g>
}

function Crates({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>{[0, 1, 2].map(row => [0, 1, 2].map(col => <g key={`${row}-${col}`}><Block x={col * 29 + row * 14} y={row * -9} width={24} depth={13} height={22} color="var(--chart-2)" /><path d={`M${col * 29 + row * 14 + 4} ${row * -9 + 6} h16 m-16 5 h16`} stroke="var(--warning-foreground)" strokeWidth="2" /></g>))}</g>
}

function Truck({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}>
    <ellipse cx="62" cy="66" rx="78" ry="13" fill="var(--muted-foreground)" opacity=".16" />
    <Block x={20} y={0} width={92} depth={27} height={46} color="var(--card)" />
    <path d="M24 8 h83 M24 14 h83 M24 20 h83 M24 26 h83 M24 32 h83" stroke="var(--border)" />
    {/* Puerta trasera abierta: cara isométrica alineada con la descarga. */}
    <path d="M115 5 136 -5.5 V30 L115 40.5 Z" fill="var(--foreground)" stroke="var(--border)" strokeWidth="2" />
    <path d="M115 5 136 -5.5 136 -25 115 -14.5 Z" fill="var(--card)" stroke="var(--border)" />
    <path d="M116 34 135 24.5 V31 L116 40.5 Z" fill="var(--chart-2)" />
    <Block x={-9} y={23} width={33} depth={25} height={30} color="var(--primary)" />
    <path d="M-5 26 h17 v13 h-17 Z" fill="var(--foreground)" /><path d="M26 45 h86 v10 H0" fill="none" stroke="var(--muted-foreground)" strokeWidth="6" />
    {[9, 42, 97].map(cx => <g key={cx}><ellipse cx={cx} cy="55" rx="8" ry="11" fill="var(--foreground)" /><ellipse cx={cx} cy="55" rx="4" ry="6" fill="var(--border)" /></g>)}
    <rect x="-9" y="43" width="6" height="5" rx="1" fill="var(--warning)" />
  </g>
}

function Person({ x, y }: { x: number; y: number }) {
  return <g transform={`translate(${x} ${y})`}><ellipse cy="28" rx="10" ry="4" fill="var(--foreground)" opacity=".12" /><circle cy="-9" r="5" fill="#efc299" /><path d="M-5 -6 Q0 -13 5 -6" stroke="var(--chart-2)" strokeWidth="4" /><path d="M-5 0 h10 l3 15 h-16 Z" fill="var(--primary)" /><path d="M-3 15 v12 M3 15 v12" stroke="var(--foreground)" strokeWidth="4" /><path d="M-6 3 l-5 10 M6 3 l5 5" stroke="#efc299" strokeWidth="3" /></g>
}

function Conveyor({ y }: { y: number }) {
  return <g>
    <path d={`M${UNLOADING_POINT.x} ${y} H650 l55 40 h180`} fill="none" stroke="var(--border)" strokeWidth="34" strokeLinejoin="round" />
    <path d={`M${UNLOADING_POINT.x} ${y} H650 l55 40 h180`} fill="none" stroke="var(--secondary)" strokeWidth="25" strokeLinejoin="round" />
    <path d={`M${UNLOADING_POINT.x} ${y} H650 l55 40 h180`} fill="none" stroke="var(--primary)" strokeWidth="2" className="weekly-flow-route" />
    {[290, 395, 500, 610].map(x => <path key={x} d={`M${x} ${y + 15} v25 m-6 0 h12`} stroke="var(--muted-foreground)" strokeWidth="3" />)}
  </g>
}

function MovingCrates({ y, clipId }: { y: number; clipId: string }) {
  return <g clipPath={`url(#${clipId})`}><g transform={`translate(${UNLOADING_POINT.x} ${y - 18})`}>
    {[0, 1, 2, 3, 4].map(index => <g key={index} className="weekly-flow-movingCrate" style={{ animationDelay: `${-index * 3.6}s` }}>
      <Block x={-12} y={0} width={24} depth={12} height={18} color="var(--chart-2)" />
      <path d="M-8 5 h16 m-16 5 h16" stroke="var(--warning-foreground)" strokeWidth="1.5" />
    </g>)}
  </g></g>
}

function FlowScene({ paused }: { paused: boolean }) {
  const id = useId().replace(/:/g, "")
  return <svg viewBox="0 -100 1200 400" className={`weekly-flow-scene ${paused ? "weekly-flow-paused" : ""}`} aria-hidden="true">
    <defs><linearGradient id={`${id}-floor`} x2="0" y2="1"><stop stopColor="var(--background)" /><stop offset="1" stopColor="var(--secondary)" /></linearGradient><filter id={`${id}-shadow`} x="-20%" y="-40%" width="140%" height="180%"><feDropShadow dx="0" dy="9" stdDeviation="9" floodColor="var(--foreground)" floodOpacity=".12" /></filter><clipPath id={`${id}-unload`}><rect x={UNLOADING_POINT.x - 6} y="100" width="700" height="130" /></clipPath></defs>
    <g filter={`url(#${id}-shadow)`}><path d="M35 160 235 38 1165 109 1000 282 35 230 Z" fill={`url(#${id}-floor)`} /><path d="M35 230 1000 282 1165 109 1165 129 1000 299 35 246 Z" fill="var(--border)" /></g>
    <path d="M410 62 340 246 M790 90 708 267" stroke="var(--card)" strokeWidth="3" />
    <Block x={109} y={85} width={190} depth={40} height={60} color="var(--border)" />
    <path d="M129 92 h147 v43 H129 Z" fill="var(--muted-foreground)" />
    {[0,1,2].map(i => <path key={i} d={`M${144 + i * 48} 96 v35`} stroke="var(--secondary)" strokeWidth="4" />)}
    <Truck x={131} y={126} />
    <Conveyor y={UNLOADING_POINT.y} />
    {/* Puente de descarga apoyado en el piso del remolque y en la faja. */}
    <path d="M253 150 273 140 288 149 268 159 Z" fill="var(--secondary)" stroke="var(--muted-foreground)" strokeWidth="1.5" />
    <path d="M253 150 268 159 288 149" fill="none" stroke="var(--primary)" strokeWidth="2" />
    <Block x={489} y={92} width={97} depth={25} height={23} color="var(--border)" />
    <Block x={515} y={68} width={47} depth={12} height={32} color="var(--foreground)" />
    <path d="M522 75 h31 m-31 6 h20 m-20 6 h25" stroke="var(--chart-1)" strokeWidth="3" />
    <Person x={607} y={103} />
    <path d="M643 126 v22 m-5 -6 5 6 5 -6 M676 174 l22 17 m-10 -1 10 1 -3 -9" fill="none" stroke="var(--primary)" strokeWidth="3" />
    <MovingCrates y={UNLOADING_POINT.y} clipId={`${id}-unload`} />
    <Block x={846} y={189} width={139} depth={40} height={12} color="var(--muted-foreground)" />
    <Crates x={845} y={173} /><Crates x={859} y={148} /><Crates x={873} y={123} />
    <Block x={1010} y={132} width={71} depth={26} height={32} color="var(--border)" />
    <Block x={1028} y={111} width={34} depth={12} height={24} color="var(--foreground)" />
    <path d="M1033 118 h23 m-23 6 h16" stroke="var(--chart-1)" strokeWidth="2" />
    <g transform="translate(1004 195) scale(1.4)"><Person x={0} y={0} /><path d="M8 4 l10 -3 4 14 -10 3 Z" fill="var(--card)" stroke="var(--primary)" /><path d="M12 5 l5 4 5 -8" stroke="var(--primary)" fill="none" strokeWidth="2" /></g>
    <circle cx="1081" cy="104" r="9" fill="var(--success)" className="weekly-flow-signal" /><circle cx="1081" cy="104" r="4" fill="var(--primary)" />
    <g fill="var(--muted-foreground)" fontSize="12" fontWeight="700" letterSpacing="3"><text x="150" y="244" transform="rotate(3 150 244)">LLEGADAS</text><text x="500" y="265" transform="rotate(3 500 265)">PLANNING</text><text x="846" y="282" transform="rotate(3 846 282)">SUPERVISIÓN</text></g>
  </svg>
}

export function WeeklyFlowCard({ summary }: { summary: Summary }) {
  const [paused, setPaused] = useState(false)
  const difference = summary.arrivedCrates - summary.plannedCrates
  const sign = difference > 0 ? "+" : ""
  const percent = summary.plannedCrates > 0 ? `${sign}${(difference / summary.plannedCrates * 100).toFixed(1)}%` : "Sin base de comparación"
  const stages = [
    { title: "Llegada real", value: formatInt(summary.arrivedCrates), note: null, color: "var(--primary)" },
    { title: "Plan semanal", value: formatInt(summary.plannedCrates), note: null, color: "var(--primary)" },
    { title: "Diferencia", value: sign + formatInt(difference), note: `${percent} respecto al plan`, color: "var(--warning-foreground)" },
  ]
  return <section aria-labelledby="weekly-flow-title" className="overflow-hidden rounded-[20px] border border-border/60 bg-card">
    <div className="flex items-center justify-between gap-3 px-5 pt-5 sm:px-6">
      <div className="flex items-center gap-3">
        <span className="rounded-xl bg-success p-2 text-success-foreground"><Boxes size={20} aria-hidden /></span>
        <h2 id="weekly-flow-title" className="font-heading text-xl font-bold">Flujo operativo</h2>
      </div>
      <button type="button" onClick={() => setPaused(!paused)} title={paused ? "Reanudar animación" : "Pausar animación"} aria-label={paused ? "Reanudar animación del flujo" : "Pausar animación del flujo"} aria-pressed={paused} className="flex size-10 shrink-0 items-center justify-center rounded-full text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-ring">
        {paused ? <Play size={16} aria-hidden /> : <Pause size={16} aria-hidden />}
      </button>
    </div>
    <div className="mt-3 overflow-x-auto bg-gradient-to-b from-card to-muted/60" tabIndex={0} role="region" aria-label="Ilustración del flujo: llegadas, planning y supervisión">
      <div className="weekly-flow-stage">
        <FlowScene paused={paused} />
        <div className="weekly-flow-statistics">{stages.map(stage => <article key={stage.title} className="weekly-flow-statistic"><h3 className="text-xs font-semibold text-muted-foreground">{stage.title}</h3><p className="font-heading text-2xl leading-8 font-bold tabular-nums">{stage.value} <span className="font-sans text-xs font-medium text-muted-foreground">jabas</span></p>{stage.note && <p className="text-xs font-semibold" style={{ color: stage.color }}>{stage.note}</p>}</article>)}</div>
      </div>
    </div>
  </section>
}
