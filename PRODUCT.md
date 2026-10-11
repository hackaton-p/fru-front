# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Three roles at Pura Fruit packing plants (Piura · Santa María and Sullana). All of them are plant staff, not technical users; the challenge brief requires an interface "usable by plant staff without technical training".

- **Planificador** (desktop/laptop, office): each week, crosses the harvest projection with the commercial program and the plant's capacity, simulates scenarios, applies the official plan, and sends it for approval.
- **Subgerente de Operaciones Packing** (desktop/laptop, office): the decision maker. Reviews and approves or rejects plans for every plant, follows the week's progress (projected vs executed), and edits plant configuration.
- **Jefe de turno** (tablet or phone, on the plant floor, shift starts ~5 PM): sees the approved plan, records arrivals per area, logs progress during the shift, adjusts hours, and closes the day. Uses it in a noisy, hands-busy environment with divided attention.

## Product Purpose

Plan de Packing replaces improvised planning. Today harvest projects how much fruit arrives and sales projects how much it sells, but no plan crosses both with plant capacity, which leads to improvised staffing, long days, and the risk of a second shift. The system:

1. Takes the harvest projection (per day) and the commercial program (per client), both loaded from Excel and read-only.
2. Calculates a weekly plan per plant: daily target, workers, and hours.
3. Sends it through approval by the subgerente.
4. During each shift, records progress, compares incoming volume against the plan, raises alerts, and adjusts hours.
5. At closing, records real hours, target met, and the difference.

**Current success:** a prototype for Reto 1 "Packing al ritmo de la fruta" (Piura Innova regional hackathon) that convinces the jury and Pura Fruit against the challenge's criteria: it proposes a plan from a fruit volume and a commercial program, considers capacity and staffing, shows clear indicators (hours of operation, program fulfillment), lets users simulate scenarios ("more fruit arrives than projected"), and stays simple for plant staff.

## Positioning

The plan is calculated, never guessed: workers and hours come from the plant's own yield, efficiency, and capacity parameters. The single goal of the whole flow is to avoid a second shift: every day carries a status (within shift, needs overtime, risk of extra shift, low margin) and the shift lead sees the live estimate change with each record.

## Operating Context

- Weekly ritual: the planner loads Excel projections, simulates, applies, and sends; the subgerente approves or rejects with a comment (required on rejection).
- Daily ritual: packing starts around 17:00. The shift lead opens the shift (arrived/starting per area), logs progress, staff, and volume changes, adjusts hours with a reason (CAMBIO_VOLUMEN or PERSONAL_PRESENTE), and closes.
- Shared top menu: Dashboard · Planificador · Subgerente · Jefe de turno · Configuración, filtered by role.
- Reference screens: the "Plan de Packing · Pantallas" artifact (https://claude.ai/artifact/AZVy84DGpaZidzHRiivV7q). System context: `../../contexto-plan-packing.md`.

## Capabilities and Constraints

- Stack: Next.js 16 (App Router) + shadcn/ui + Tailwind v4 frontend; NestJS backend (`../purafruit-back`). All calculations live in the backend (`PlanCalculatorService`); the front only mirrors formulas for live previews. `API_MOCK=true` serves in-memory mock data while the API is unavailable.
- Interface language: Spanish (`lang="es"`).
- Unit: **jabas only**. No boxes, no conversions. Hours are decimal (9.5 = 9 h 30 min).
- One plan per plant, fruit, and week. One shift only. No production lines in the MVP.
- Workers are calculated by the system, never entered by the planner. All staff counts (packing, almacén, trazabilidad, mantenimiento, saneamiento).
- Plant configuration holds defaults only; each plan stores its final values (`parametrosUsados`), and values that differ from the default are flagged "(default X)".
- Projections are immutable. The simulation is never saved until applied as the official plan.
- Plan states: BORRADOR → PENDIENTE → APROBADO / RECHAZADO → EN_EJECUCION → CERRADO.
- Fruits: uva and arándano; varieties come later.
- Undecided / out of MVP: official yield and max-staff values (current ones are inferred from week 41), per-client commercial gap, fruit carried to the next day, approval and hour-adjustment history, real Sullana data for "Curso de la semana".

## Brand Commitments

- Name: Pura Fruit / "purafruit". Product title: "Plan de Packing · Pura Fruit".
- Official logo: "p" mark with the "purafruit" wordmark, `../../logo-purafruit-color.svg` (copy into `public/` when used).
- Brand values recorded in the system context (§7): green #2E9E4A (#1E7F38 for text and buttons), coral #E2483C (#C2382C for text) reserved for alerts, dark #1F1F1F, background #F3F4F2, Baloo 2 for headings and Nunito for body, projected in amber #E8A23A and executed in green #1E7F38 (color-blind safe). Implemented in `app/theme.css`.
- Status labels and colors are fixed product vocabulary (e.g. "Pendiente de aprobación" amber, "Riesgo de turno extra" coral).

## Evidence on Hand

- Sample data (week 42, Piura and Sullana, uva and arándano, real client names in the commercial program) in `lib/repositories/mock/data.ts`, taken from the reference screens.
- Week 41 reports were the source for yields and area ratios.
- Challenge brief: `../../Problematica.jpeg`; materials in `../../reto PF/`.
- No testimonials, adoption metrics, or results exist; do not fabricate them.

## Product Principles

1. **Calculated, not typed.** The system derives workers and hours; people adjust parameters and scenarios, never the outputs.
2. **Avoid the second shift.** Every screen makes the risk of exceeding the shift visible early, with the number that explains it.
3. **Simple for plant staff.** Plain Spanish, product vocabulary over jargon, one clear next action per step.
4. **Right device for the role.** Office roles get dense, scannable desktop views; the shift lead gets large, touch-first controls that work at a glance on the floor.
5. **Final values are the truth.** What a plan used is what it shows, always traceable back to the plant default.

## Accessibility & Inclusion

- Alerts always carry icon and text, never color alone.
- Chart palette (amber projected / green executed) is validated for color blindness.
- Shift-lead views must stay legible and operable on a tablet or phone in a noisy plant at night.
