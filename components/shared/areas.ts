import type { AreaCodigo } from "@/lib/domain"

/** Nombre en pantalla de cada área de personal. */
export const AREA_LABEL: Record<AreaCodigo, string> = {
  PACKING: "Packing",
  ALMACEN: "Almacén",
  TRAZABILIDAD: "Trazabilidad",
  MANTENIMIENTO: "Mantenimiento",
  SANEAMIENTO: "Saneamiento",
}
