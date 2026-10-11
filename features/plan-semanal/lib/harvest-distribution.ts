export function distributeHarvest(total: number, days = 7): number[] {
  const cents = Math.round(total * 100)
  const base = Math.floor(cents / days)
  const remainder = cents % days
  return Array.from({ length: days }, (_, index) => (base + (index < remainder ? 1 : 0)) / 100)
}
