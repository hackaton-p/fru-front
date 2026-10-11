import type { DashboardData } from "./schema"

/** Reportes de ejemplo de la referencia; editar aquí para probar otros escenarios. */
export const dashboardMock: DashboardData = {
  "year": 2026,
  "week": 41,
  "period": "05/10 al 09/10",
  "source": "reportes diarios Sullana y Santa María / Piura",
  "plants": [
    {
      "id": "piura",
      "weeklyFlow": { "plannedCrates": 60000, "arrivedCrates": 61500 },
      "name": "Piura",
      "label": "Piura (Santa María)",
      "shiftHours": 10,
      "defaultYield": 5.9,
      "days": [
        {
          "label": "Lun 05",
          "closed": true,
          "projectedCrates": 12000,
          "executedCrates": 10490,
          "hours": 8.33,
          "projectedStaff": 277,
          "executedStaff": 209,
          "discardPercent": 7.9
        },
        {
          "label": "Mar 06",
          "closed": true,
          "projectedCrates": 10000,
          "executedCrates": 10178,
          "hours": 9.08,
          "projectedStaff": 247,
          "executedStaff": 192,
          "discardPercent": 9.1
        },
        {
          "label": "Mié 07",
          "closed": true,
          "projectedCrates": 12000,
          "executedCrates": 11234,
          "hours": 9.45,
          "projectedStaff": 277,
          "executedStaff": 192,
          "discardPercent": 9.7
        },
        {
          "label": "Jue 08",
          "closed": true,
          "projectedCrates": 13000,
          "executedCrates": 12527,
          "hours": 11.75,
          "projectedStaff": 284,
          "executedStaff": 191,
          "discardPercent": 10.6
        },
        {
          "label": "Vie 09",
          "closed": false,
          "projectedCrates": 13000,
          "executedCrates": null,
          "hours": null,
          "projectedStaff": 284,
          "executedStaff": 186,
          "discardPercent": null
        }
      ]
    },
    {
      "id": "sullana",
      "weeklyFlow": { "plannedCrates": 195900, "arrivedCrates": 201000 },
      "name": "Sullana",
      "label": "Sullana",
      "shiftHours": 12,
      "defaultYield": 3.9,
      "days": [
        {
          "label": "Lun 05",
          "closed": true,
          "projectedCrates": 36000,
          "executedCrates": 38247,
          "hours": 12,
          "projectedStaff": 812,
          "executedStaff": 916,
          "discardPercent": 7.52
        },
        {
          "label": "Mar 06",
          "closed": true,
          "projectedCrates": 37300,
          "executedCrates": 39265,
          "hours": 11.75,
          "projectedStaff": 836,
          "executedStaff": 915,
          "discardPercent": 10.53
        },
        {
          "label": "Mié 07",
          "closed": true,
          "projectedCrates": 40500,
          "executedCrates": 35895,
          "hours": 9.5,
          "projectedStaff": 896,
          "executedStaff": 912,
          "discardPercent": 8.24
        },
        {
          "label": "Jue 08",
          "closed": true,
          "projectedCrates": 40000,
          "executedCrates": 28730,
          "hours": 7.25,
          "projectedStaff": 887,
          "executedStaff": 936,
          "discardPercent": 4.15
        },
        {
          "label": "Vie 09",
          "closed": false,
          "projectedCrates": 42100,
          "executedCrates": null,
          "hours": null,
          "projectedStaff": 926,
          "executedStaff": 929,
          "discardPercent": null
        }
      ]
    }
  ]
}
