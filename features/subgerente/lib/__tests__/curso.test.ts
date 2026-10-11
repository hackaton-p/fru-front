import { describe, expect, it } from "vitest"
import { cursoMock } from "@/lib/repositories/mock/curso-data"
import { filasCurso, lecturaSemana, resumirCurso, type FilaCurso } from "../curso"

const HOY = new Date("2026-10-10T12:00:00Z")
const curso = cursoMock({ plantaId: 1, frutaId: 1, semana: 41 }, HOY)!

function fila(filas: FilaCurso[], label: string) {
  const f = filas.find((x) => x.tipo === "dato" && x.label === label)
  if (!f || f.tipo !== "dato") throw new Error(`Sin fila ${label}`)
  return f
}

describe("resumirCurso (Piura sem 41, reporte Santa María)", () => {
  const r = resumirCurso(curso)!

  it("solo cuenta los 4 días cerrados; el viernes sigue en curso", () => {
    expect(r.cerrados).toHaveLength(4)
    expect(r.enCurso.map((d) => d.fecha)).toEqual(["2026-10-09"])
  })

  it("cumplimiento 94.5%: 44,429 de 47,000 jabas", () => {
    expect(r.jabasEjecutadas).toBe(44_429)
    expect(r.jabasProyectadasCerradas).toBe(47_000)
    expect(r.cumplimiento).toBeCloseTo(0.945, 3)
  })

  it("horas: 38.61 en total, 9.7 h de promedio, de 8.3 h a 11.8 h", () => {
    expect(r.horasTotal).toBeCloseTo(38.61, 2)
    expect(r.horasPromedio).toBeCloseTo(9.65, 2)
    expect(r.horasMin).toBe(8.33)
    expect(r.horasMax).toBe(11.75)
  })

  it("rendimiento 5.9 jabas por persona-hora y personal ejecutado 72% (784 de 1,085)", () => {
    expect(r.rendimiento).toBeCloseTo(5.89, 2)
    expect(r.personalEjecutado).toBe(784)
    expect(r.personalProyectado).toBe(1_085)
    expect(Math.round(r.personalEjecutadoRatio * 100)).toBe(72)
  })

  it("descarte promedio 9.3%, subiendo a 10.6%", () => {
    expect(r.descartePromedio).toBeCloseTo(0.093, 3)
    expect(r.descarteUltimo).toBe(0.106)
  })

  it("devuelve null si ninguna jornada está cerrada", () => {
    const abierto = {
      ...curso,
      dias: curso.dias.map((d) => ({ ...d, jabasEjecutadas: null, horas: null })),
    }
    expect(resumirCurso(abierto)).toBeNull()
  })
})

describe("filasCurso", () => {
  const filas = filasCurso(curso, resumirCurso(curso)!)

  it("marca bajo lo proyectado los días y la semana con menos jabas ejecutadas", () => {
    const ej = fila(filas, "Jabas ejecutadas")
    expect(ej.dias.map((c) => c.valor)).toEqual(["10,490", "10,178", "11,234", "12,527", "en curso"])
    expect(ej.dias.map((c) => Boolean(c.bajo))).toEqual([true, false, true, true, false])
    expect(ej.semana).toEqual({ valor: "44,429", bajo: true })
  })

  it("totales de personal por semana: 1,369 proyectado y 970 ejecutado", () => {
    const totales = filas.filter((f) => f.tipo === "dato" && f.label.startsWith("Total"))
    expect(totales.map((f) => (f.tipo === "dato" ? f.semana.valor : ""))).toEqual(["1,369", "970"])
  })

  it("rendimiento por día con 1 decimal", () => {
    expect(fila(filas, "Rendimiento (jabas por persona-hora)").dias[0].valor).toBe("6.0")
  })
})

describe("lecturaSemana", () => {
  it("explica la falta de personal, el rendimiento y el descarte con los datos", () => {
    const lectura = lecturaSemana(curso, resumirCurso(curso)!, 10)
    expect(lectura[0]).toBe(
      "Se proyectaron 247 a 284 personas por día y se tuvieron 186 a 209. La falta de personal de packing (~76 personas por día) explica que las horas suban de 8.3 h a 11.8 h.",
    )
    expect(lectura[1]).toMatch(
      /^El rendimiento se mantiene entre 5\.\d y 6\.\d jabas por persona-hora; con el personal planificado/,
    )
    expect(lectura[2]).toBe("El descarte subió de 7.9% a 10.6% a lo largo de la semana.")
  })
})
