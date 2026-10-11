import { describe, expect, it } from "vitest"
import { nextPlanningMonday, planningDates } from "@/lib/dates"
import { canSelectPlanningDate, defaultPlanningDates, isValidPlanningSelection, togglePlanningDate } from "../planning-calendar"

const monday = "2026-10-12"

describe("Calendario de planificación", () => {
  it.each([
    ["2026-10-11T12:00:00Z", "2026-10-12"],
    ["2026-10-12T04:59:00Z", "2026-10-12"],
    ["2026-10-12T05:00:00Z", "2026-10-19"],
    ["2026-10-14T12:00:00Z", "2026-10-19"],
    ["2026-08-31T12:00:00Z", "2026-09-07"],
    ["2026-12-28T12:00:00Z", "2027-01-04"],
  ])("obtiene el siguiente lunes con la fecha de Perú en %s", (now, expected) => {
    expect(nextPlanningMonday(new Date(now))).toBe(expected)
  })
  it("bloquea semanas pasadas y la semana actual", () => {
    const minimum = nextPlanningMonday(new Date("2026-10-12T12:00:00Z"))
    expect(canSelectPlanningDate("2026-10-05", null, minimum)).toBe(false)
    expect(canSelectPlanningDate(monday, null, minimum)).toBe(false)
    expect(isValidPlanningSelection(monday, [monday, "2026-10-14"], minimum)).toBe(false)
    expect(canSelectPlanningDate("2026-10-19", null, minimum)).toBe(true)
    expect(canSelectPlanningDate("2026-11-02", null, minimum)).toBe(true)
  })
  it("permite solo lunes como primer clic", () => {
    expect(canSelectPlanningDate(monday, null)).toBe(true)
    expect(canSelectPlanningDate("2026-10-13", null)).toBe(false)
    expect(canSelectPlanningDate("2026-10-18", null)).toBe(false)
  })
  it("selecciona de lunes a sábado inicialmente y limita la misma semana", () => {
    expect(defaultPlanningDates(monday)).toEqual([monday, "2026-10-13", "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"])
    for (let day = 12; day <= 17; day++) expect(canSelectPlanningDate(`2026-10-${day}`, monday)).toBe(true)
    expect(canSelectPlanningDate("2026-10-18", monday)).toBe(false)
    expect(canSelectPlanningDate("2026-10-19", monday)).toBe(false)
  })
  it("permite marcar y desmarcar días salteados conservando el lunes", () => {
    const initial = defaultPlanningDates(monday)
    const removed = togglePlanningDate(monday, initial, "2026-10-13")
    expect(removed).toEqual([monday, "2026-10-14", "2026-10-15", "2026-10-16", "2026-10-17"])
    expect(togglePlanningDate(monday, removed, "2026-10-13")).toEqual(initial)
    expect(togglePlanningDate(monday, initial, monday)).toEqual(initial)
    expect(togglePlanningDate(monday, initial, "2026-10-18")).toEqual(initial)
  })
  it("impide desmarcar el último día adicional al lunes", () => {
    const selected = [monday, "2026-10-17"]
    expect(togglePlanningDate(monday, selected, "2026-10-17")).toEqual(selected)
    expect(isValidPlanningSelection(monday, selected)).toBe(true)
    expect(isValidPlanningSelection(monday, [monday])).toBe(false)
  })
  it("rechaza fechas duplicadas, omisión de lunes y días de otras semanas", () => {
    for (const dates of [[monday, monday], ["2026-10-13", "2026-10-14"], [monday, "2026-10-18"], [monday, "2026-10-19"]]) expect(isValidPlanningSelection(monday, dates)).toBe(false)
    expect(isValidPlanningSelection(undefined, undefined)).toBe(false)
    expect(canSelectPlanningDate("2026-02-30", null)).toBe(false)
    expect(canSelectPlanningDate("invalid", null)).toBe(false)
  })
  it("mantiene las fechas elegidas al resolver los días del formulario", () => {
    expect(planningDates({ anio: 2026, semana: 42, inicio: monday, cantidadDias: 3, fechas: ["2026-10-17", monday, "2026-10-14"] })).toEqual([monday, "2026-10-14", "2026-10-17"])
  })
  it("maneja semanas que cruzan mes y año", () => {
    expect(defaultPlanningDates("2026-12-28")).toEqual(["2026-12-28", "2026-12-29", "2026-12-30", "2026-12-31", "2027-01-01", "2027-01-02"])
    expect(isValidPlanningSelection("2026-12-28", ["2026-12-28", "2027-01-02"])).toBe(true)
  })
})
