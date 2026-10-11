---
version: 1
slug: "app-app-subgerente"
primary_target: "app/(app)/subgerente"
related_targets: []
---

# Subgerente · Planes y curso

Scope: `/subgerente/planes` (list), `/subgerente/planes/[id]` (plan detail with decision), `/subgerente/curso` (week progress). Visitor mode: **Operate**. Desktop/laptop, office.

Audience and job: the Subgerente de Operaciones Packing decides which weekly plans each plant executes, and checks how the running week is going. Task frequency: a few plans per week, read carefully; the curso tab is checked daily.

Proof/content: plans from the mock store (seeded weeks 40–42 for Piura and Sullana, plus whatever the planner sends live). Curso data is the real Santa María / Piura week 41 report; Sullana has no real execution data and shows an empty state.

Constraints: reference composition is the "Subgerente · Planes y curso" board of the Plan de Packing · Pantallas artifact; shadcn/ui components only, installed with the official shadcn CLI; incumbent theme in `app/theme.css`. Role switcher (demo cookie) gives access until real login exists.

Unresolved: per-client commercial gap; approval history (only current fields exist); Sullana execution data.

## Direction contract

THESIS: A decision desk, not a report. Every view answers "what needs my decision and is it safe to approve?" The category default (a flat admin list of records with an edit button) is refused: rows lead with the action their state allows, and the detail ends in one decision block.

OWN-WORLD: The incumbent Pura Fruit world: #F3F4F2 ground, white rounded cards, Baloo 2 headings, Nunito body, green #1E7F38 primary, amber for pending and changed-from-default values, coral reserved for alerts and below-plan numbers, dark pill for the active view. shadcn Button, Badge, Card, Table, Alert, Field, Textarea, Empty.

STORY: The subgerente sees how many plans wait (red counter on the Planes tab), filters by state, opens a pending plan, reads the commercial alert, KPIs, the values the planner changed against the plant default, and the daily plan per area, then approves or rejects with a required comment. In Curso they see projected vs executed per day and what explains the gap.

FIRST VIEWPORT: Top app header and role nav; under it a view switch (Planes · N pending | Curso de la semana) as dark/white pills. Planes: H1 "Planes semanales" with a summary line, state filter pills with counts, then the plans table; the primary action "Revisar y aprobar" sits in the last column of each pending row in green.

FORM: Reference board composition (pinned by the brief, no concept-seed roll; precisely specified surface inside the established world). Signature move: below-plan execution cells marked in coral with a down arrow, and changed parameters shown as amber "(default X)" chips — the eye lands on what deviates.

FINISH: unreviewed and undocumented is unfinished; this build ends with the finish review, the verdict, DESIGN.md, and every shipping raster carrying its provenance
