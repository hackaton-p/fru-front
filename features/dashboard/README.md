# Dashboard

`/dashboard` utiliza el layout y la navegación existentes. Los componentes reciben datos, sin conocer su origen.

- `mock-data.ts`: reportes configurables de Piura y Sullana, basados en el diseño.
- `schema.ts`: contrato validado con Zod para mocks y respuestas HTTP. Una medición pendiente se representa con `null`; `closed` determina si la jornada participa en los indicadores.
- `queries.ts`: carga en servidor usando el cliente HTTP existente (autenticación y timeout incluidos).
- `metrics.ts`: cálculos y definiciones de gráficos independientes de React.
- `components/`: selector, indicadores y gráficos reutilizables, adaptables a móvil y accesibles por teclado.

Con `API_MOCK=true` usa los datos de ejemplo. Con `API_MOCK=false`, consulta `/dashboard` (o `DASHBOARD_API_PATH`) con el año y semana ISO actuales y la planta del usuario cuando tiene una asignada. `api-mapper.ts` adapta la respuesta real del backend y los catálogos al contrato de `schema.ts`, incluyendo siete días vacíos cuando no hay planificación aprobada.

Los promedios y acumulados excluyen jornadas abiertas o incompletas. El rendimiento semanal se pondera por persona-horas; jabas por trabajador se calcula sobre el personal total de los días cerrados. Sin jornadas cerradas los indicadores se muestran en cero. El diseño conserva el flujo operativo, seis indicadores, tres puntos de atención y seis gráficos. Sin planificación aprobada muestra un mensaje y un enlace al planificador para esa planta y semana. Las mediciones ausentes se presentan en cero en los gráficos.

El card panorámico del flujo semanal usa `plants[].weeklyFlow`, con `plannedCrates` (plan semanal) y `arrivedCrates` (recepción real). La diferencia absoluta y porcentual se calculan en la vista. Estos totales de recepción son independientes de las jabas procesadas de los reportes diarios. El campo es opcional para mantener compatibilidad con respuestas existentes. La escena isométrica SVG está animada con CSS, permite pausar el movimiento y respeta `prefers-reduced-motion`.
