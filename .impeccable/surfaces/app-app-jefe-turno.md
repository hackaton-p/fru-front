---
version: 1
slug: "app-app-jefe-turno"
primary_target: "app/(app)/jefe-turno"
related_targets: []
---

# Jefe de turno · Jornada

Scope: `/jefe-turno`, one screen with three stages (Iniciar jornada → Durante la jornada → Cierre). Visitor mode: **Operate**. Tablet or phone on the plant floor, shift starts ~17:00, noisy, hands busy, divided attention.

Audience and job: the jefe de turno opens the day of the approved plan, records who arrived and who starts per area, logs progress (avance de volumen, cambio de personal, cambio de volumen del día), adjusts hours with a reason when the estimate no longer fits, and closes the day.

Proof/content: Piura (Santa María) week 41 plan in execution; the open day is Friday 09/10 (meta 13,000 jabas, plan 276 workers in ≈10 h). Every step persists in the mock store through server actions; closing the day feeds the subgerente's "Curso de la semana" and closes the plan. "Reiniciar jornada (demo)" only in mock mode.

Constraints: reference composition is the "Jefe de turno · Jornada" board of Plan de Packing · Pantallas; shadcn/ui components (new ones via the official shadcn CLI); incumbent world in DESIGN.md. Calculations follow contexto §4 and §6 (REGISTRO_AVANCE); the mock replicates the back.

Unresolved: real start time (MVP uses the scheduled start); fruit carried to the next day (out of MVP, a negative difference records it).

## Direction contract

THESIS: A shift dashboard that answers one question at a glance: "do we finish inside the plan's hours?" The live estimate in hours is the hero of every stage; the category default (a data-entry form with a submit button and a table of past rows) is refused.

OWN-WORLD: The incumbent Pura Fruit world from DESIGN.md: #F3F4F2 ground, white rounded cards, Baloo 2 headings and stat numbers, Nunito body, Packing Green primary, amber for "needs overtime", coral only for alarms (risk of extra shift, alerts), dark pill for the current stage. Touch-first density: 48px inputs and buttons, large tabular numerals.

STORY: The shift lead sees the stage they are in, types arrivals and starts per area while the estimated end time updates, starts the day; during the shift they log events and watch status and the estimate change after each record, accept the proposed hour adjustment when it no longer fits, then close with the real figures and see whether the target was met.

FIRST VIEWPORT: App header; H1 "Jornada · Viernes 09/10" with the plant, scheduled start, target and plan line; a three-step stage indicator. Stage 1: the per-area table with Llegaron / Inician inputs on the left and, on the right (below on phones), the estimate card with the hours at display size, the expected end time, the status message, and the primary "Iniciar jornada con N trabajadores" button.

FORM: Reference board composition (pinned by the brief, no concept-seed roll; precisely specified surface inside the established world). Signature move: the estimate in hours set at display scale, recolored by status (green within plan, amber overtime, coral risk), re-stated after every record in "Registros de hoy".

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
