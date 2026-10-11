export function distributeHarvest(total: number, days = 7): number[] {
  if (!Number.isSafeInteger(total) || total < 0 || !Number.isInteger(days) || days < 1) throw new RangeError("La cosecha y la cantidad de días deben ser enteros válidos.")
  const base = Math.floor(total / days)
  const remainder = total % days
  return Array.from({ length: days }, (_, index) => base + (index < remainder ? 1 : 0))
}
