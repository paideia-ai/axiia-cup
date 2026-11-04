// 海选 groups (§5.2): Q players into E single-elimination groups.

import { shuffle } from './rng.ts'
import type { Player } from './types.ts'

// Sizes differ by at most one. Default where the rules are silent: the
// last Q mod E groups (the ones headed by the lowest first-pass seeds) are
// the larger ones, so the strongest seeds are not the ones facing an extra
// round or giving up a bye.
export function groupSizes(Q: number, E: number): number[] {
  if (Q <= E) return []
  const base = Math.floor(Q / E)
  const extra = Q % E
  return Array.from(
    { length: E },
    (_, g) => base + (g >= E - extra ? 1 : 0),
  )
}

// Seeding list for the 海选: ranked players by ladder rank, then the unranked
// in a lottery drawn from the roster seed.
export function prelimSeedList(players: readonly Player[], seed: string) {
  const ranked = players.filter((p) => p.ladderRank !== null)
    .sort((x, y) => x.ladderRank! - y.ladderRank! || cmp(x.id, y.id))
  const unranked = shuffle(
    players.filter((p) => p.ladderRank === null)
      .sort((x, y) => cmp(x.id, y.id)),
    `${seed}/prelim-lottery`,
  )
  return [...ranked, ...unranked]
}

export function cmp(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}

// Snake distribution of the seed list across the groups: pass 1 left to
// right, pass 2 right to left, … skipping full groups. The lottery-drawn
// unranked players continue the same snake, which is how they "fill the
// remaining positions". Each group comes back in group-seed order.
export function buildGroups(
  players: readonly Player[],
  E: number,
  seed: string,
): Player[][] {
  const sizes = groupSizes(players.length, E)
  if (sizes.length === 0) return []
  const order = prelimSeedList(players, seed)
  const groups: Player[][] = sizes.map(() => [])
  let next = 0
  for (let pass = 0; next < order.length; pass++) {
    for (let i = 0; i < E && next < order.length; i++) {
      const g = pass % 2 === 0 ? i : E - 1 - i
      if (groups[g].length < sizes[g]) groups[g].push(order[next++])
    }
  }
  return groups
}
