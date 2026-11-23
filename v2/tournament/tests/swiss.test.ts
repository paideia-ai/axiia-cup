import { assert, assertEquals } from '@std/assert'
import { random } from '../src/rng.ts'
import { swissPair, type SwissRecord, swissStandings } from '../src/swiss.ts'

Deno.test('9 rounds of 101 players: no repeat pairing, no repeat bye, byes to the bottom', () => {
  const n = 101
  const r = random('swiss-test')
  const state = Array.from({ length: n }, (_, i) => ({
    id: `p${i + 1}`,
    seed: i + 1,
    score: 0,
    met: new Set<string>(),
    hadBye: false,
  }))
  const byes: string[] = []
  for (let round = 1; round <= 9; round++) {
    const { pairs, bye } = swissPair(state)
    assert(bye)
    byes.push(bye)
    const byID = new Map(state.map((s) => [s.id, s]))
    const seen = new Set<string>([bye])
    for (const [p, q] of pairs) {
      const sp = byID.get(p)!
      const sq = byID.get(q)!
      assert(!sp.met.has(q), `round ${round}: repeat ${p}-${q}`)
      assert(!seen.has(p) && !seen.has(q))
      seen.add(p)
      seen.add(q)
      sp.met.add(q)
      sq.met.add(p)
      const x = r()
      if (x < 0.45) sp.score += 3
      else if (x < 0.9) sq.score += 3
      else (sp.score += 1, sq.score += 1)
    }
    assertEquals(seen.size, n)
    const b = byID.get(bye)!
    b.score += 3
    b.hadBye = true
  }
  assertEquals(new Set(byes).size, byes.length)
})

Deno.test('round 1 pairs the top half against the bottom half by seed', () => {
  const entrants = Array.from({ length: 8 }, (_, i) => ({
    id: `s${i + 1}`,
    seed: i + 1,
    score: 0,
    met: new Set<string>(),
    hadBye: false,
  }))
  assertEquals(swissPair(entrants).pairs, [['s1', 's5'], ['s2', 's6'], ['s3', 's7'], [
    's4',
    's8',
  ]])
})

Deno.test('standings: points, Buchholz, weighted, actual wins, tokens; full tie needs a ruling', () => {
  const rec = (id: string, seed: number, tokens: number, rounds: SwissRecord['rounds']) => ({
    id,
    seed,
    tokens,
    rounds,
  })
  const W = (opp: string) => ({ kind: 'pair' as const, opp, pts: 3, win: true })
  const L = (opp: string) => ({ kind: 'pair' as const, opp, pts: 0, win: false })
  const records = [
    rec('a', 1, 10, [W('c'), L('b')]),
    rec('b', 2, 10, [W('d'), W('a')]),
    rec('c', 3, 10, [L('a'), W('d')]),
    rec('d', 4, 10, [L('b'), L('c')]),
  ]
  const s = swissStandings(records, 2)
  assertEquals(s.map((x) => x.id), ['b', 'a', 'c', 'd'])
  // a and c: 3 points each; Buchholz a = c(3) + b(6) = 9, c = a(3) + d(0) = 3.
  assertEquals(s[1].buchholz, 9)
  assertEquals(s[2].buchholz, 3)
  assertEquals(s.every((x) => !x.tie), true)

  // Two players with identical everything: unresolved until ruled.
  const tied = [
    rec('x', 1, 10, [{ kind: 'bye', pts: 3 }]),
    rec('y', 2, 10, [{ kind: 'bye', pts: 3 }]),
  ]
  const open = swissStandings(tied, 1)
  assertEquals(open.map((t) => [t.id, t.rank, t.tie]), [['x', 1, 'unresolved'], [
    'y',
    1,
    'unresolved',
  ]])
  const ruled = swissStandings(tied, 1, [{
    players: ['y', 'x'],
    reason: 'lot',
    by: 't',
    at: 'now',
  }])
  assertEquals(ruled.map((t) => [t.id, t.rank, t.tie]), [['y', 1, 'ruled'], ['x', 2, 'ruled']])
  // Fewer tokens breaks the tie before any ruling.
  const fewer = swissStandings([tied[0], { ...tied[1], tokens: 9 }], 1)
  assertEquals(fewer.map((t) => t.id), ['y', 'x'])
})

Deno.test('bye: virtual opponent V = score before + 1 + (R − r)', () => {
  const s = swissStandings([
    { id: 'p', seed: 1, tokens: 1, rounds: [{ kind: 'bye', pts: 3 }, null, null] },
  ], 3)
  // r = 1: 0 + 1 + 2 = 3
  assertEquals([s[0].buchholz, s[0].weighted], [3, 9])
})
