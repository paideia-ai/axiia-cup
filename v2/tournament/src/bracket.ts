// Fixed seeded single-elimination brackets: the 64 knockout (§7) and every
// 海选 group (§5.2) use the same shape.

export function nextPow2(n: number): number {
  let size = 1
  while (size < n) size *= 2
  return size
}

// Seeds in bracket-slot order for a bracket of `size` (a power of two):
// size 8 → [1, 8, 4, 5, 2, 7, 3, 6]. Adjacent slots meet in round 1
// (1–8, 4–5, 2–7, 3–6); seeds 1 and 2 sit in opposite halves, the top 4 in
// separate quarters, the top 8 in separate eighths.
export function seedOrder(size: number): number[] {
  if (size < 1 || nextPow2(size) !== size) {
    throw new Error(`bracket size must be a power of two, got ${size}`)
  }
  let order = [1]
  while (order.length < size) {
    const n = order.length * 2
    order = order.flatMap((s) => [s, n + 1 - s])
  }
  return order
}

// Slot list for `entrants` given in seed order (index 0 = seed 1). Seeds past
// the entrant count are byes, so the highest seeds get them first.
export function bracketSlots<T>(entrants: readonly T[]): (T | null)[] {
  if (entrants.length === 0) return []
  const size = nextPow2(entrants.length)
  return seedOrder(size).map((seed) => entrants[seed - 1] ?? null)
}

export function bracketRounds(entrantCount: number): number {
  return entrantCount <= 1 ? 0 : Math.log2(nextPow2(entrantCount))
}
