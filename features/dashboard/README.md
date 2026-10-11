# Dashboard

`/dashboard` utiliza el layout y la navegación existentes. Los componentes reciben datos, sin conocer su origen.

- `mock-data.ts`: reportes configurables de Piura y Sullana, basados en el diseño.
- `schema.ts`: contrato validado con Zod para mocks y respuestas HTTP. Una medición pendiente se representa con `null`; `closed` determina si la jornada participa en los indicadores.
- `queries.ts`: carga en servidor usando el cliente HTTP existente (autenticación y timeout incluidos).
- `metrics.ts`: cálculos y definiciones de gráficos independientes de React.
- `components/`: selector, indicadores y gráficos reutilizables, adaptables a móvil y accesibles por teclado.

Por defecto usa `API_MOCK=true`. Para integrar el backend, configurar `API_MOCK=false`, `API_URL` y, opcionalmente, `DASHBOARD_API_PATH` (por defecto `/dashboard`). El endpoint GET debe devolver el contrato de `schema.ts`, con la misma estructura de `mock-data.ts`. Esta ruta es un contrato propuesto, pendiente de coordinación con el backend.

Los promedios y acumulados excluyen jornadas abiertas o incompletas. El rendimiento semanal se pondera por persona-horas; jabas por trabajador se calcula sobre el personal total de los días cerrados. Sin jornadas cerradas se presenta un estado sin datos.

El card panorámico del flujo semanal usa `plants[].weeklyFlow`, con `plannedCrates` (plan semanal) y `arrivedCrates` (recepción real). La diferencia absoluta y porcentual se calculan en la vista. Estos totales de recepción son independientes de las jabas procesadas de los reportes diarios. El campo es opcional para mantener compatibilidad con respuestas existentes. La escena isométrica SVG está animada con CSS, permite pausar el movimiento y respeta `prefers-reduced-motion`.
