// Derives the whole tournament from the locked roster, the operator's rulings
// and withdrawals, and the matches the server holds for this tournament's tag.
// Nothing else is state: rerunning derive on the same inputs gives the same
// pairings, and the pairings recorded on the server are checked against it.

import { bracketRounds, bracketSlots } from './bracket.ts'
import { decidePair, type GameResult } from './outcome.ts'
import { buildGroups } from './prelim.ts'
import {
  type RoundEntry,
  type Standing,
  swissPair,
  type SwissRecord,
  swissSeeds,
  swissStandings,
} from './swiss.ts'
import {
  type GameView,
  type MatchRecord,
  type Pair,
  type PairWinner,
  type Player,
  type Roster,
  type Rulings,
  type Stage,
  STAGE_ORDER,
  type SubmitItem,
  totalTokens,
  type Withdrawal,
} from './types.ts'

export interface EngineInput {
  roster: Roster
  matches: readonly MatchRecord[]
  rulings?: Rulings
  withdrawals?: readonly Withdrawal[]
}

export interface BracketMatch {
  round: number
  index: number // 1-based within the round
  p: string | null
  q: string | null
  pairID?: string
  // undefined = not decided yet; null = nobody advances.
  winner?: string | null
}

export interface PrelimGroup {
  id: string
  players: string[] // group seed order
  rounds: BracketMatch[][]
  winner?: string | null
}

export interface SwissRound {
  round: number
  pairs: string[]
  bye: string | null
  standings?: Standing[]
}

export interface FailedSlot {
  pairID: string
  slot: 'g1' | 'g2'
  attempts: number
  nextRetry: number
  error?: string | null
}

export interface Frontier {
  stage: Stage
  round: number
}

export interface TournamentState {
  roster: Roster
  players: Map<string, Player>
  pairs: Map<string, Pair>
  prelim: {
    skipped: boolean
    groups: PrelimGroup[]
    rounds: number
    advancers?: string[]
  }
  swiss: {
    seeds?: string[]
    rounds: SwissRound[]
    final?: Standing[]
  }
  ko: {
    seeds?: string[]
    rounds: BracketMatch[][]
    champion?: string | null
  }
  // First round that is not settled; null once the champion is known.
  frontier: Frontier | null
  blocked?: string
  toSubmit: SubmitItem[]
  failed: FailedSlot[]
  pendingGames: number
  awaitingRuling: string[]
  done: boolean
}

export class DriftError extends Error {}

const pad = (n: number, width: number) => String(n).padStart(width, '0')

export function gameKey(
  roster: Roster,
  pairID: string,
  slot: 'g1' | 'g2',
  retry = 0,
): string {
  const base = `${roster.tournament}/${roster.scenarioID}/${pairID}/${slot}`
  return retry > 0 ? `${base}#retry${retry}` : base
}

export function scenarioTag(roster: Roster): string {
  return `${roster.tournament}/${roster.scenarioID}`
}

export function gameTags(
  roster: Roster,
  stage: Stage,
  round: number,
  pairID: string,
): string[] {
  const t = roster.tournament
  const s = roster.scenarioID
  return [t, `${t}/${s}`, `${t}/${s}/${stage}/r${round}`, `${t}/${s}/pair/${pairID}`]
}

interface Attempt {
  retry: number
  match: MatchRecord
}

function indexMatches(roster: Roster, matches: readonly MatchRecord[]) {
  const prefix = `${roster.tournament}/${roster.scenarioID}/`
  const pattern = /^(.+)\/(g1|g2)(?:#retry(\d+))?$/
  const bySlot = new Map<string, Attempt[]>()
  for (const match of matches) {
    if (!match.key.startsWith(prefix)) continue
    const m = pattern.exec(match.key.slice(prefix.length))
    if (!m) continue
    const slotKey = `${m[1]}/${m[2]}`
    const list = bySlot.get(slotKey) ?? []
    list.push({ retry: m[3] ? Number(m[3]) : 0, match })
    bySlot.set(slotKey, list)
  }
  for (const list of bySlot.values()) list.sort((x, y) => x.retry - y.retry)
  return bySlot
}

export function derive(input: EngineInput): TournamentState {
  const { roster } = input
  const rulings = input.rulings ?? {}
  const withdrawals = input.withdrawals ?? []
  const players = new Map(roster.players.map((p) => [p.id, p]))
  const attempts = indexMatches(roster, input.matches)
  const usedSlots = new Set<string>()

  const state: TournamentState = {
    roster,
    players,
    pairs: new Map(),
    prelim: { skipped: false, groups: [], rounds: 0 },
    swiss: { rounds: [] },
    ko: { rounds: [] },
    frontier: null,
    toSubmit: [],
    failed: [],
    pendingGames: 0,
    awaitingRuling: [],
    done: false,
  }

  const withdrawnAt = (id: string, stage: Stage, round: number) =>
    withdrawals.some((w) =>
      w.player === id &&
      (STAGE_ORDER[w.stage] < STAGE_ORDER[stage] ||
        (w.stage === stage && w.round <= round))
    )

  const tokens = (id: string) => totalTokens(players.get(id)!)

  function slotView(
    pairID: string,
    slot: 'g1' | 'g2',
    expectA: number,
    expectB: number,
  ): { view?: GameView; finished?: MatchRecord; state: string } {
    const list = attempts.get(`${pairID}/${slot}`) ?? []
    usedSlots.add(`${pairID}/${slot}`)
    for (const { match } of list) {
      if (match.a.versionID !== expectA || match.b.versionID !== expectB) {
        throw new DriftError(
          `${match.key}: server has versions ${match.a.versionID}/${match.b.versionID}, ` +
            `the derived pairing expects ${expectA}/${expectB}. ` +
            'Roster, rulings or withdrawals changed after this round was submitted.',
        )
      }
    }
    if (list.length === 0) return { state: 'unsubmitted' }
    const finished = list.find((a) => a.match.status === 'finished')
    const live = list.find((a) => a.match.status === 'queued' || a.match.status === 'running')
    const shown = finished ?? live ?? list[list.length - 1]
    const m = shown.match
    const view: GameView = {
      slot,
      key: m.key,
      matchID: m.matchID,
      status: m.status,
      winner: m.winner,
      scoreA: m.scoreA,
      scoreB: m.scoreB,
      attempts: list.length,
      ...(typeof m.facts?.scheme === 'string' ? { scheme: m.facts.scheme } : {}),
      ...(m.error ? { error: m.error } : {}),
    }
    if (finished) return { view, finished: finished.match, state: 'finished' }
    if (live) return { view, state: 'pending' }
    return { view, state: 'failed' }
  }

  function resolvePair(
    stage: Stage,
    round: number,
    pairID: string,
    pID: string,
    qID: string,
  ): Pair {
    const p = players.get(pID)!
    const q = players.get(qID)!
    const pair: Pair = {
      id: pairID,
      stage,
      round,
      p: pID,
      q: qID,
      seed: `${roster.seed}/${pairID}`,
      status: 'unsubmitted',
      winsP: 0,
      winsQ: 0,
      tokensP: totalTokens(p),
      tokensQ: totalTokens(q),
      games: [],
    }
    state.pairs.set(pairID, pair)

    const forfeit = rulings.forfeits?.[pairID]
    const wp = withdrawnAt(pID, stage, round)
    const wq = withdrawnAt(qID, stage, round)
    if (forfeit || wp || wq) {
      for (const slot of ['g1', 'g2'] as const) usedSlots.add(`${pairID}/${slot}`)
      let winner: PairWinner
      if (forfeit) {
        winner = forfeit.winner === pID ? 'p' : forfeit.winner === qID ? 'q' : 'none'
        pair.note = `forfeit: ${forfeit.reason}`
      } else {
        winner = wp && wq ? 'none' : wp ? 'q' : 'p'
        pair.note = 'withdrawal'
      }
      return Object.assign(pair, {
        status: 'decided',
        winner,
        decidedBy: 'walkover',
      })
    }

    const g1 = slotView(pairID, 'g1', p.a.versionID, q.b.versionID)
    const g2 = slotView(pairID, 'g2', q.a.versionID, p.b.versionID)
    pair.games = [g1.view, g2.view].filter((g): g is GameView => !!g)

    const queue = (slot: 'g1' | 'g2', a: number, b: number, retry: number) =>
      state.toSubmit.push({
        key: gameKey(roster, pairID, slot, retry),
        scenarioID: roster.scenarioID,
        a: { versionID: a },
        b: { versionID: b },
        tags: gameTags(roster, stage, round, pairID),
        seed: pair.seed,
      })

    if (g1.finished && g2.finished) {
      const result = (m: MatchRecord): GameResult => ({
        winner: m.winner,
        scoreA: m.scoreA ?? 0,
        scoreB: m.scoreB ?? 0,
        facts: m.facts,
      })
      const ruled = rulings.pairs?.[pairID]
      const ruling: PairWinner | undefined = !ruled
        ? undefined
        : ruled.winner === pID
        ? 'p'
        : ruled.winner === qID
        ? 'q'
        : ruled.winner === 'draw'
        ? 'draw'
        : undefined
      const d = decidePair(
        roster.scenarioID,
        stage,
        result(g1.finished),
        result(g2.finished),
        { p: pair.tokensP, q: pair.tokensQ },
        ruling,
      )
      Object.assign(pair, {
        status: d.status,
        winsP: d.winsP,
        winsQ: d.winsQ,
        primaryP: d.primaryP,
        primaryQ: d.primaryQ,
        ...(d.winner ? { winner: d.winner, decidedBy: d.decidedBy } : {}),
        ...(d.note
          ? { note: d.decidedBy === 'ruling' ? `${d.note}; ${ruled!.reason}` : d.note }
          : {}),
      })
      if (d.status === 'awaiting-ruling') state.awaitingRuling.push(pairID)
      return pair
    }

    const slots = [
      { slot: 'g1' as const, v: g1, a: p.a.versionID, b: q.b.versionID },
      { slot: 'g2' as const, v: g2, a: q.a.versionID, b: p.b.versionID },
    ]
    for (const s of slots) {
      if (s.v.state === 'unsubmitted') queue(s.slot, s.a, s.b, 0)
      if (s.v.state === 'pending') state.pendingGames++
      if (s.v.state === 'failed') {
        const n = attempts.get(`${pairID}/${s.slot}`)!
        state.failed.push({
          pairID,
          slot: s.slot,
          attempts: n.length,
          nextRetry: n[n.length - 1].retry + 1,
          error: s.v.view?.error,
        })
      }
    }
    pair.status = slots.some((s) => s.v.state === 'unsubmitted')
      ? 'unsubmitted'
      : slots.some((s) => s.v.state === 'failed')
      ? 'failed'
      : 'pending'
    return pair
  }

  const winnerOf = (pair: Pair): string | null | undefined => {
    if (pair.status !== 'decided') return undefined
    if (pair.winner === 'p') return pair.p
    if (pair.winner === 'q') return pair.q
    return null
  }

  // Single-elimination round from its entrant slots. A withdrawn player in a
  // slot facing nobody simply drops out.
  function eliminationRound(
    stage: Stage,
    round: number,
    entrants: (string | null)[],
    pairID: (index: number) => string,
  ): BracketMatch[] {
    const out: BracketMatch[] = []
    for (let i = 0; i < entrants.length; i += 2) {
      let p = entrants[i]
      let q = entrants[i + 1]
      const index = i / 2 + 1
      if (p && q) {
        const id = pairID(index)
        const pair = resolvePair(stage, round, id, p, q)
        out.push({ round, index, p, q, pairID: id, winner: winnerOf(pair) })
        continue
      }
      if (p && withdrawnAt(p, stage, round)) p = null
      if (q && withdrawnAt(q, stage, round)) q = null
      out.push({ round, index, p, q, winner: p ?? q ?? null })
    }
    return out
  }

  const settled = (matches: BracketMatch[]) => matches.every((m) => m.winner !== undefined)

  // --- 海选 -----------------------------------------------------------------
  const { E, R, koSize } = roster.config
  const prelimPlayers = roster.players.filter((p) => !p.direct)
  let advancers: string[]
  if (prelimPlayers.length <= E) {
    state.prelim.skipped = true
    advancers = prelimPlayers.map((p) => p.id)
  } else {
    const groups = buildGroups(prelimPlayers, E, roster.seed)
    state.prelim.groups = groups.map((g, i) => ({
      id: `g${pad(i + 1, 3)}`,
      players: g.map((p) => p.id),
      rounds: [],
    }))
    const current = groups.map((g) => bracketSlots(g.map((p) => p.id)))
    const roundsPerGroup = groups.map((g) => bracketRounds(g.length))
    state.prelim.rounds = Math.max(...roundsPerGroup)
    for (let k = 1; k <= state.prelim.rounds; k++) {
      let open = false
      state.prelim.groups.forEach((group, g) => {
        if (roundsPerGroup[g] < k) return
        const matches = eliminationRound(
          'prelim',
          k,
          current[g],
          (m) => `prelim-${group.id}-r${k}-m${m}`,
        )
        group.rounds.push(matches)
        if (!settled(matches)) open = true
        else current[g] = matches.map((m) => m.winner!)
      })
      if (open) return finish({ stage: 'prelim', round: k })
    }
    state.prelim.groups.forEach((group, g) => {
      group.winner = roundsPerGroup[g] === 0
        ? (withdrawnAt(group.players[0], 'prelim', 1) ? null : group.players[0])
        : current[g][0]
    })
    advancers = state.prelim.groups.map((g) => g.winner).filter(
      (w): w is string => !!w,
    )
  }
  state.prelim.advancers = advancers

  // --- 瑞士轮 -----------------------------------------------------------------
  const swissIDs = new Set([
    ...roster.players.filter((p) => p.direct).map((p) => p.id),
    ...advancers,
  ])
  const seeds = swissSeeds(
    roster.players.filter((p) => swissIDs.has(p.id)),
    roster.seed,
  )
  state.swiss.seeds = seeds
  const seedOf = new Map(seeds.map((id, i) => [id, i + 1]))
  const records = new Map<string, SwissRecord>(
    seeds.map((id) => [id, {
      id,
      seed: seedOf.get(id)!,
      tokens: tokens(id),
      rounds: [],
    }]),
  )
  for (let r = 1; r <= R; r++) {
    const active = seeds.filter((id) => !withdrawnAt(id, 'swiss', r))
    const entrants = active.map((id) => {
      const rec = records.get(id)!
      const met = new Set<string>()
      let hadBye = false
      let score = 0
      for (const e of rec.rounds) {
        if (!e) continue
        score += e.pts
        if (e.kind !== 'bye' && e.opp) met.add(e.opp)
        if (e.kind === 'bye' || (e.kind === 'forfeit' && e.pts === 3)) {
          hadBye = true
        }
      }
      return { id, seed: rec.seed, score, met, hadBye }
    })
    const pairing = swissPair(entrants)
    const round: SwissRound = { round: r, pairs: [], bye: pairing.bye }
    state.swiss.rounds.push(round)
    const results: Pair[] = pairing.pairs.map(([p, q], i) => {
      const id = `swiss-r${r}-b${pad(i + 1, 3)}`
      round.pairs.push(id)
      return resolvePair('swiss', r, id, p, q)
    })
    if (results.some((p) => p.status !== 'decided')) {
      return finish({ stage: 'swiss', round: r })
    }
    for (const rec of records.values()) rec.rounds[r - 1] = null
    if (pairing.bye) records.get(pairing.bye)!.rounds[r - 1] = { kind: 'bye', pts: 3 }
    for (const pair of results) {
      const pts = (side: 'p' | 'q') => pair.winner === side ? 3 : pair.winner === 'draw' ? 1 : 0
      for (const side of ['p', 'q'] as const) {
        const me = side === 'p' ? pair.p : pair.q
        const opp = side === 'p' ? pair.q : pair.p
        const entry: RoundEntry = pair.decidedBy === 'walkover'
          ? { kind: 'forfeit', opp, pts: pts(side) }
          : { kind: 'pair', opp, pts: pts(side), win: pair.winner === side }
        records.get(me)!.rounds[r - 1] = entry
      }
    }
    round.standings = swissStandings(
      [...records.values()],
      r,
      rulings.standings,
    )
  }
  const final = state.swiss.rounds[R - 1]?.standings ?? []
  state.swiss.final = final

  // --- 64 强 ------------------------------------------------------------------
  const eligible = final.filter((s) => !withdrawnAt(s.id, 'ko', 1))
  const top = eligible.slice(0, koSize)
  const unresolved = top.filter((s) => s.tie === 'unresolved')
  if (unresolved.length) {
    state.blocked = `full Swiss tie at rank(s) ${
      [...new Set(unresolved.map((s) => s.rank))].join(', ')
    } needs a 组委会 standings ruling: ${unresolved.map((s) => s.id).join(', ')}`
    return finish({ stage: 'ko', round: 1 })
  }
  state.ko.seeds = top.map((s) => s.id)
  let slots: (string | null)[] = bracketSlots(state.ko.seeds)
  const koRounds = bracketRounds(top.length)
  for (let k = 1; k <= koRounds; k++) {
    const matches = eliminationRound(
      'ko',
      k,
      slots,
      (m) => `ko-r${k}-m${pad(m, 2)}`,
    )
    state.ko.rounds.push(matches)
    if (!settled(matches)) return finish({ stage: 'ko', round: k })
    slots = matches.map((m) => m.winner!)
  }
  state.ko.champion = koRounds === 0 ? (top[0]?.id ?? null) : slots[0]
  return finish(null)

  function finish(frontier: Frontier | null): TournamentState {
    state.frontier = frontier
    state.done = frontier === null
    for (const slotKey of attempts.keys()) {
      if (!usedSlots.has(slotKey)) {
        throw new DriftError(
          `server holds games for ${slotKey}, which the derived pairings do not contain. ` +
            'Roster, rulings or withdrawals changed after that round was submitted.',
        )
      }
    }
    return state
  }
}

// Submit items for retrying failed slots under the next retry key.
export function retryItems(state: TournamentState, maxAttempts = Infinity): SubmitItem[] {
  return state.failed.filter((f) => f.attempts < maxAttempts).map((f) => {
    const pair = state.pairs.get(f.pairID)!
    const p = state.players.get(pair.p)!
    const q = state.players.get(pair.q)!
    const [a, b] = f.slot === 'g1' ? [p.a.versionID, q.b.versionID] : [q.a.versionID, p.b.versionID]
    return {
      key: gameKey(state.roster, f.pairID, f.slot, f.nextRetry),
      scenarioID: state.roster.scenarioID,
      a: { versionID: a },
      b: { versionID: b },
      tags: gameTags(state.roster, pair.stage, pair.round, f.pairID),
      seed: pair.seed,
    }
  })
}
