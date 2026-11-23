// Deciding one pair from its two games (§2–§4, §6.2, §7).
//
// Game 1 is P's A agent vs Q's B agent, game 2 is Q's A agent vs P's B agent.

import type { DecidedBy, PairWinner, ScenarioID, Stage } from './types.ts'

export interface GameResult {
  winner: 'a' | 'b' | 'draw' | null
  scoreA: number
  scoreB: number
  facts?: Record<string, unknown> | null
}

export const SCHEME_ABANDON = '放弃连环计'
export const SCHEME_CONTINUE = '继续连环计'

export interface Primary {
  ok: boolean
  p: number | null
  q: number | null
  reason?: string
}

export function gameWins(g1: GameResult, g2: GameResult) {
  return {
    winsP: (g1.winner === 'a' ? 1 : 0) + (g2.winner === 'b' ? 1 : 0),
    winsQ: (g1.winner === 'b' ? 1 : 0) + (g2.winner === 'a' ? 1 : 0),
  }
}

// Scores are multiples of 0.25 (§4.1): sum in quarter units so the comparison
// is exact. A score off the grid is kept as is rather than silently rounded.
function quarters(x: number): number {
  const q = x * 4
  return Math.abs(q - Math.round(q)) < 1e-9 ? Math.round(q) : q
}

function schemeValue(game: GameResult): number | null {
  const scheme = game.facts?.scheme
  if (scheme === SCHEME_ABANDON) return 1
  if (scheme === SCHEME_CONTINUE) return 0
  return null
}

// The per-scenario primary metric for P and Q (§4.1). For fengyiting it reads
// the `scheme` fact of the game each player won: 1 = 放弃, 0 = 继续, null when
// that player won no game.
export function primary(
  scenario: ScenarioID,
  g1: GameResult,
  g2: GameResult,
): Primary {
  switch (scenario) {
    case 'shangyang-court':
    case 'honnoji-decision': {
      const p = quarters(g1.scoreA) + quarters(g2.scoreB)
      const q = quarters(g1.scoreB) + quarters(g2.scoreA)
      return { ok: true, p: p / 4, q: q / 4 }
    }
    case 'trolley-problem':
      // SCORE_CASE = 1, so scoreA/scoreB are sub-cases won.
      return { ok: true, p: g1.scoreA + g2.scoreB, q: g1.scoreB + g2.scoreA }
    case 'fengyiting-real': {
      const pGame = g1.winner === 'a' ? g1 : g2.winner === 'b' ? g2 : null
      const qGame = g1.winner === 'b' ? g1 : g2.winner === 'a' ? g2 : null
      const p = pGame ? schemeValue(pGame) : null
      const q = qGame ? schemeValue(qGame) : null
      if ((pGame && p === null) || (qGame && q === null)) {
        return { ok: false, p, q, reason: 'missing facts.scheme' }
      }
      return { ok: true, p, q }
    }
  }
}

export interface Decision {
  status: 'decided' | 'awaiting-ruling'
  winner?: PairWinner
  decidedBy?: DecidedBy
  winsP: number
  winsQ: number
  primaryP: number | null
  primaryQ: number | null
  note?: string
}

// ruling: the 组委会 call for this pair, already mapped to p/q/draw. It is used
// only where the rules leave the pair to them.
export function decidePair(
  scenario: ScenarioID,
  stage: Stage,
  g1: GameResult,
  g2: GameResult,
  tokens: { p: number; q: number },
  ruling?: PairWinner,
): Decision {
  const { winsP, winsQ } = gameWins(g1, g2)
  const prim = primary(scenario, g1, g2)
  const base = { winsP, winsQ, primaryP: prim.p, primaryQ: prim.q }
  const draws = [g1, g2].filter((g) => g.winner !== 'a' && g.winner !== 'b')
  const drawNote = draws.length ? `${draws.length} game(s) without a winner` : undefined

  if (winsP !== winsQ) {
    return {
      ...base,
      status: 'decided',
      winner: winsP > winsQ ? 'p' : 'q',
      decidedBy: 'games',
      note: drawNote,
    }
  }

  const byRuling = (reason: string): Decision =>
    ruling && (ruling !== 'draw' || stage === 'swiss')
      ? {
        ...base,
        status: 'decided',
        winner: ruling,
        decidedBy: 'ruling',
        note: reason,
      }
      : { ...base, status: 'awaiting-ruling', note: reason }

  if (!prim.ok) return byRuling(prim.reason ?? 'primary unreadable')

  const pv = prim.p ?? -Infinity
  const qv = prim.q ?? -Infinity
  if (pv !== qv) {
    return {
      ...base,
      status: 'decided',
      winner: pv > qv ? 'p' : 'q',
      decidedBy: 'primary',
      note: drawNote,
    }
  }

  // Swiss: an even primary is a drawn pair, no secondary, no ruling (§6.2).
  if (stage === 'swiss') {
    return {
      ...base,
      status: 'decided',
      winner: 'draw',
      decidedBy: 'draw',
      note: drawNote,
    }
  }

  if (tokens.p !== tokens.q) {
    return {
      ...base,
      status: 'decided',
      winner: tokens.p < tokens.q ? 'p' : 'q',
      decidedBy: 'secondary',
      note: drawNote,
    }
  }

  return byRuling('primary and prompt tokens tied')
}
