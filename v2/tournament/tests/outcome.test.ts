import { assertEquals } from '@std/assert'
import { decidePair, type GameResult, SCHEME_ABANDON, SCHEME_CONTINUE } from '../src/outcome.ts'

const g = (
  winner: GameResult['winner'],
  scoreA = 0,
  scoreB = 0,
  scheme?: string,
): GameResult => ({ winner, scoreA, scoreB, facts: scheme ? { scheme } : null })
const even = { p: 100, q: 100 }

Deno.test('2-0 decides by games, in every stage', () => {
  // g1: P's A beats Q's B; g2: Q's A loses to P's B.
  for (const stage of ['prelim', 'swiss', 'ko'] as const) {
    const d = decidePair('shangyang-court', stage, g('a', 3, 1), g('b', 1, 3), even)
    assertEquals([d.winner, d.decidedBy, d.winsP, d.winsQ], ['p', 'games', 2, 0])
  }
})

Deno.test('a game without a winner counts for nobody', () => {
  const d = decidePair('honnoji-decision', 'ko', g('draw', 2, 2), g('a', 3, 1), even)
  assertEquals([d.winner, d.decidedBy, d.winsP, d.winsQ], ['q', 'games', 0, 1])
})

Deno.test('1-1: primary is the score sum in quarter units (商鞅, 本能寺)', () => {
  // P: 2.25 + 1.5 = 3.75; Q: 1.75 + 2.5 = 4.25
  const d = decidePair('shangyang-court', 'prelim', g('a', 2.25, 1.75), g('a', 2.5, 1.5), even)
  assertEquals([d.winner, d.decidedBy, d.primaryP, d.primaryQ], ['q', 'primary', 3.75, 4.25])
  const h = decidePair('honnoji-decision', 'ko', g('b', 1, 2), g('b', 0.25, 3), even)
  assertEquals([h.winner, h.decidedBy], ['p', 'primary'])
})

Deno.test('1-1: 电车难题 primary is sub-cases won', () => {
  const d = decidePair('trolley-problem', 'ko', g('a', 3, 2), g('a', 3, 1), even)
  // P: 3 + 1 = 4, Q: 2 + 3 = 5
  assertEquals([d.winner, d.primaryP, d.primaryQ], ['q', 4, 5])
})

Deno.test('1-1: 凤仪亭 primary is the scheme fact of the game each side won', () => {
  const d = decidePair(
    'fengyiting-real',
    'ko',
    g('a', 1, 0, SCHEME_ABANDON), // P won, 貂蝉 abandoned → 1
    g('a', 1, 0, SCHEME_CONTINUE), // Q won, continued → 0
    even,
  )
  assertEquals([d.winner, d.decidedBy, d.primaryP, d.primaryQ], ['p', 'primary', 1, 0])
})

Deno.test('凤仪亭 without a scheme fact waits for a ruling', () => {
  const d = decidePair(
    'fengyiting-real',
    'prelim',
    g('a', 1, 0),
    g('a', 1, 0, SCHEME_ABANDON),
    even,
  )
  assertEquals(d.status, 'awaiting-ruling')
  const ruled = decidePair(
    'fengyiting-real',
    'prelim',
    g('a', 1, 0),
    g('a', 1, 0, SCHEME_ABANDON),
    even,
    'q',
  )
  assertEquals([ruled.status, ruled.winner, ruled.decidedBy], ['decided', 'q', 'ruling'])
})

Deno.test('Swiss: even primary is a drawn pair, tokens never used', () => {
  const d = decidePair('shangyang-court', 'swiss', g('a', 2, 1), g('a', 2, 1), { p: 1, q: 999 })
  assertEquals([d.winner, d.decidedBy], ['draw', 'draw'])
})

Deno.test('elimination: even primary → fewer prompt tokens advances', () => {
  const d = decidePair('shangyang-court', 'ko', g('a', 2, 1), g('a', 2, 1), { p: 900, q: 800 })
  assertEquals([d.winner, d.decidedBy], ['q', 'secondary'])
})

Deno.test('elimination: primary and tokens tied → 组委会; a draw ruling is refused', () => {
  const args = ['shangyang-court', 'prelim', g('a', 2, 1), g('a', 2, 1), even] as const
  assertEquals(decidePair(...args).status, 'awaiting-ruling')
  assertEquals(decidePair(...args, 'draw').status, 'awaiting-ruling')
  const d = decidePair(...args, 'p')
  assertEquals([d.winner, d.decidedBy], ['p', 'ruling'])
})
