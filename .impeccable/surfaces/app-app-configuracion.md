---
version: 1
slug: "app-app-configuracion"
primary_target: "app/(app)/configuracion"
related_targets: []
---

# Configuración de planta

Scope: `/configuracion`, one screen with a Piura / Sullana plant switch. Visitor mode: **Operate**. Desktop, office use, the subgerente editing defaults now and then; other roles look them up.

Audience and job: the subgerente keeps each plant's default calculation parameters (rendimiento, personal máximo, jornada, horas extra, hora de inicio, eficiencia, tolerancia). The planificador's weekly simulation starts from them; the jefe de turno's alerts depend on tolerance and overtime. Planificador and jefe de turno see the same values read-only.

Proof/content: the mock plants (Piura rend 5.9, máx 300, 10 h + 2, 80 %, 5 %; Sullana rend 3.9, máx 1,200, 12 h + 2). The live example uses the peak day of next week's harvest projection for that plant. Saving persists in the mock store and new simulations use it; saved plans keep their `parametrosUsados`.

Constraints: reference composition is the "Configuración de planta" board of Plan de Packing · Pantallas; shadcn/ui (new components via the official CLI); incumbent world in DESIGN.md. Validations follow contexto §6 PLANTA. Back endpoint `PATCH /plantas/:id`.

## Direction contract

THESIS: A settings page that shows consequences. Every edit re-states, live, what the system will propose for a real day (workers, hours, margin). The category default (a flat form with a save button and nothing else) is refused.

OWN-WORLD: The incumbent Pura Fruit world from DESIGN.md: #F3F4F2 ground, white rounded cards, Baloo 2 headings and figures, Nunito body, Packing Green primary, amber for "changed / unsaved", coral only for alarms. The reference's coral group header is refused (Coral Is an Alarm).

STORY: The subgerente picks a plant, changes a value, sees the field marked as changed and the example recalculate, reads the sticky bar "N cambios sin guardar", then saves or discards. A planificador sees the same page read-only, with a note on who can edit.

FIRST VIEWPORT: App header; H1 "Configuración de planta" with a one-line explanation and the plant switch; three parameter groups on the left (Personal y rendimiento, Jornada, Eficiencia y tolerancias); on the right, the dark "Así calcula el sistema" card and "Quién usa estos valores"; a sticky save bar at the bottom.

FORM: Reference board composition (pinned, no concept-seed roll). Signature move: the dark calculation card, whose figures change as you type; with a staff cap warning in amber when the needed staff exceeds personal máximo.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
