// 瑞士轮 (§6): initial seeds, pairing, byes, 3/1/0 standings and tiebreaks.

import { shuffle } from './rng.ts'
import { cmp } from './prelim.ts'
import type { Player, StandingsRuling } from './types.ts'

// Round-1 seeds (§6.1.1): ladder rank first, the unranked after them in a
// lottery drawn from the roster seed. Returns player ids, seed 1 first.
export function swissSeeds(players: readonly Player[], seed: string): string[] {
  const ranked = players.filter((p) => p.ladderRank !== null)
    .sort((x, y) => x.ladderRank! - y.ladderRank! || cmp(x.id, y.id))
  const unranked = shuffle(
    players.filter((p) => p.ladderRank === null)
      .sort((x, y) => cmp(x.id, y.id)),
    `${seed}/swiss-lottery`,
  )
  return [...ranked, ...unranked].map((p) => p.id)
}

export interface SwissEntrant {
  id: string
  seed: number // 1 = top seed
  score: number
  met: ReadonlySet<string>
  // Already had a bye or a forfeit win: last in line for another bye (§6.4).
  hadBye: boolean
}

export interface SwissPairing {
  pairs: [string, string][]
  bye: string | null
}

const byStanding = (x: SwissEntrant, y: SwissEntrant) => y.score - x.score || x.seed - y.seed

// Pairing order, fixed before the event (§6.1.3):
//
// 1. Odd count: the bye goes to the lowest score among players without a bye
//    or forfeit win, then the lowest seed (§6.4). Players who had one come
//    last, so a repeat bye happens only when nothing else pairs.
// 2. Players sorted by score, then seed. The top unpaired player p of a score
//    group of m unpaired players is matched with the group member m/2 places
//    below, which reproduces "top half vs bottom half by seed" (S1[i]–S2[i]),
//    and floats the lowest member of an odd group down to the next group,
//    where it meets that group's top player.
// 3. A repeat opponent is skipped: next try the group members below the
//    ideal one, then above it, then the lower score groups in order. A
//    depth-first search backtracks when the rest cannot be paired.
export function swissPair(
  entrants: readonly SwissEntrant[],
  budget = 500_000,
): SwissPairing {
  const sorted = entrants.slice().sort(byStanding)
  if (sorted.length % 2 === 0) {
    const pairs = pairAll(sorted, { left: budget })
    if (pairs) return { pairs, bye: null }
    throw new Error('Swiss pairing impossible without a repeat opponent')
  }
  const byeOrder = sorted.slice().sort((x, y) =>
    Number(x.hadBye) - Number(y.hadBye) || x.score - y.score || y.seed - x.seed
  )
  const counter = { left: budget }
  for (const candidate of byeOrder) {
    const rest = sorted.filter((e) => e !== candidate)
    const pairs = pairAll(rest, counter)
    if (pairs) return { pairs, bye: candidate.id }
  }
  throw new Error('Swiss pairing impossible without a repeat opponent')
}

function pairAll(
  sorted: SwissEntrant[],
  counter: { left: number },
): [string, string][] | null {
  if (sorted.length === 0) return []
  if (--counter.left < 0) {
    throw new Error('Swiss pairing search budget exhausted')
  }
  const p = sorted[0]
  for (const c of candidates(sorted)) {
    if (p.met.has(c.id)) continue
    const rest = sorted.filter((e) => e !== p && e !== c)
    if (!everyoneHasPartner(rest)) continue
    const tail = pairAll(rest, counter)
    if (tail) return [[p.id, c.id], ...tail]
  }
  return null
}

function candidates(sorted: SwissEntrant[]): SwissEntrant[] {
  const p = sorted[0]
  const group = sorted.filter((e) => e.score === p.score)
  const lower = sorted.filter((e) => e.score !== p.score)
  if (group.length < 2) return lower
  const ideal = Math.floor(group.length / 2)
  const order: SwissEntrant[] = []
  for (let i = ideal; i < group.length; i++) order.push(group[i])
  for (let i = ideal - 1; i >= 1; i--) order.push(group[i])
  return [...order, ...lower]
}

function everyoneHasPartner(rest: SwissEntrant[]): boolean {
  for (const x of rest) {
    if (!rest.some((y) => y !== x && !x.met.has(y.id))) return false
  }
  return true
}

// --- standings ------------------------------------------------------------------

export type RoundEntry =
  | { kind: 'pair'; opp: string; pts: number; win: boolean }
  | { kind: 'bye'; pts: number }
  | { kind: 'forfeit'; opp: string | null; pts: number }

export interface SwissRecord {
  id: string
  seed: number
  tokens: number
  // rounds[r - 1]; null = not paired that round (withdrawn).
  rounds: (RoundEntry | null)[]
}

export interface Standing {
  id: string
  position: number // 1..n, unique
  rank: number // shared by an unresolved full tie
  score: number
  buchholz: number
  weighted: number
  actualWins: number
  tokens: number
  seed: number
  tie?: 'ruled' | 'unresolved'
  record: string // "W-D-L"
}

// Standings after `rounds` rounds (§6.3), with virtual opponents for byes and
// forfeits (§6.4): V(P, r) = P's score before round r + 1 + (R − r). For the
// final table rounds = R; for an intermediate table the same formula is
// applied as if the event ended after `rounds` rounds.
export function swissStandings(
  records: readonly SwissRecord[],
  rounds: number,
  rulings: readonly StandingsRuling[] = [],
): Standing[] {
  const scoreThrough = (rec: SwissRecord, k: number) =>
    rec.rounds.slice(0, k).reduce((s, e) => s + (e?.pts ?? 0), 0)
  const finalScore = new Map(records.map((r) => [r.id, scoreThrough(r, rounds)]))

  const rows = records.map((rec) => {
    let buchholz = 0
    let weighted = 0
    let actualWins = 0
    let w = 0
    let d = 0
    let l = 0
    for (let r = 1; r <= rounds; r++) {
      const e = rec.rounds[r - 1]
      if (!e) continue
      let opp: number
      if (e.kind === 'pair') {
        opp = finalScore.get(e.opp) ?? 0
        if (e.win) actualWins++
        if (e.pts === 3) w++
        else if (e.pts === 1) d++
        else l++
      } else {
        opp = scoreThrough(rec, r - 1) + 1 + (rounds - r)
        if (e.pts === 3) w++
        else l++
      }
      buchholz += opp
      weighted += opp * e.pts
    }
    return {
      id: rec.id,
      score: finalScore.get(rec.id)!,
      buchholz,
      weighted,
      actualWins,
      tokens: rec.tokens,
      seed: rec.seed,
      record: `${w}-${d}-${l}`,
    }
  })

  const key = (x: typeof rows[number], y: typeof rows[number]) =>
    y.score - x.score ||
    y.buchholz - x.buchholz ||
    y.weighted - x.weighted ||
    y.actualWins - x.actualWins ||
    x.tokens - y.tokens
  rows.sort((x, y) => key(x, y) || x.seed - y.seed)

  const out: Standing[] = []
  for (let i = 0; i < rows.length;) {
    let j = i + 1
    while (j < rows.length && key(rows[i], rows[j]) === 0) j++
    let group = rows.slice(i, j)
    let tie: Standing['tie']
    if (group.length > 1) {
      const ids = new Set(group.map((g) => g.id))
      const ruling = rulings.find((r) => group.every((g) => r.players.includes(g.id)))
      if (ruling) {
        const order = ruling.players.filter((id) => ids.has(id))
        group = order.map((id) => group.find((g) => g.id === id)!)
        tie = 'ruled'
      } else {
        tie = 'unresolved'
      }
    }
    group.forEach((g, k) => {
      out.push({
        ...g,
        position: i + k + 1,
        rank: tie === 'unresolved' ? i + 1 : i + k + 1,
        ...(tie ? { tie } : {}),
      })
    })
    i = j
  }
  return out
}
