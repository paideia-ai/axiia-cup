import { assertEquals } from '@std/assert'
import { bracketRounds, bracketSlots, seedOrder } from '../src/bracket.ts'
import { buildGroups, groupSizes } from '../src/prelim.ts'
import type { Player } from '../src/types.ts'

Deno.test('seed order: 1–64, 32–33 … fixed bracket', () => {
  assertEquals(seedOrder(8), [1, 8, 4, 5, 2, 7, 3, 6])
  const o = seedOrder(64)
  assertEquals(o.slice(0, 4), [1, 64, 32, 33])
  // Seeds 1 and 2 meet only in the final: opposite halves.
  assertEquals(o.indexOf(1) < 32, true)
  assertEquals(o.indexOf(2) >= 32, true)
  // Round-1 pairs sum to 65.
  for (let i = 0; i < 64; i += 2) assertEquals(o[i] + o[i + 1], 65)
})

Deno.test('byes go to the highest seeds', () => {
  const slots = bracketSlots(['s1', 's2', 's3', 's4', 's5'])
  assertEquals(slots, ['s1', null, 's4', 's5', 's2', null, 's3', null])
  assertEquals(bracketRounds(5), 3)
  assertEquals(bracketRounds(1), 0)
})

Deno.test('group sizes differ by at most one; the last Q mod E groups are larger', () => {
  assertEquals(groupSizes(10, 4), [2, 2, 3, 3])
  assertEquals(groupSizes(2048, 256).every((s) => s === 8), true)
  assertEquals(groupSizes(4, 4), [])
})

const player = (i: number, ladderRank: number | null): Player => ({
  id: `p${String(i).padStart(3, '0')}`,
  ladderRank,
  direct: false,
  a: { versionID: 2 * i, tokens: 10 },
  b: { versionID: 2 * i + 1, tokens: 10 },
})

Deno.test('snake distribution; unranked continue the snake after the ranked', () => {
  // 6 ranked + 6 unranked into 4 groups of 3.
  const players = [
    ...[1, 2, 3, 4, 5, 6].map((r) => player(r, r)),
    ...[7, 8, 9, 10, 11, 12].map((i) => player(i, null)),
  ]
  const groups = buildGroups(players, 4, 'seed')
  assertEquals(groups.map((g) => g.length), [3, 3, 3, 3])
  // Pass 1: ranks 1–4 left to right; pass 2: ranks 5, 6 from the right.
  assertEquals(groups.map((g) => g[0].ladderRank), [1, 2, 3, 4])
  assertEquals(groups[3][1].ladderRank, 5)
  assertEquals(groups[2][1].ladderRank, 6)
  assertEquals(groups[1][1].ladderRank, null)
  // The lottery is a pure function of the seed.
  assertEquals(buildGroups(players, 4, 'seed'), groups)
})
