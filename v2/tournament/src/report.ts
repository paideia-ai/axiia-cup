// Report data for one scenario: standings, brackets, every pair with how it
// was decided, and (mock) the latent truth next to the result. The HTML view
// embeds a list of these; `report --json` writes them raw.

import type { BracketMatch, TournamentState } from './engine.ts'
import type { TournamentDir } from './roster.ts'
import type { Pair, Stage } from './types.ts'

export interface TruthEntry {
  strength: number
  talent: number
}

export interface PlayerRow {
  id: string
  name?: string
  ladderRank: number | null
  direct: boolean
  tokensA: number
  tokensB: number
  group?: string
  swissSeed?: number
  swissPosition?: number
  koSeed?: number
  placement?: number // 1 = champion; ties share the best place
  finish: string // where the player went out
  withdrawn?: string
  trueRank?: number
  strength?: number
}

// Compact pair: games as [slot, matchID, status, winner, scoreA, scoreB,
// scheme, attempts].
export interface PairRow {
  id: string
  stage: Stage
  round: number
  p: string
  q: string
  status: Pair['status']
  winner?: Pair['winner']
  by?: Pair['decidedBy']
  winsP: number
  winsQ: number
  primaryP?: number | null
  primaryQ?: number | null
  tokensP: number
  tokensQ: number
  note?: string
  games: [
    string,
    number,
    string,
    string | null,
    number | null,
    number | null,
    string | null,
    number,
  ][]
}

type BracketCell = [string | null, string | null, string | null, string | null | undefined]

export interface ScenarioReport {
  scenarioID: string
  tournament: string
  seed: string
  config: TournamentDir['roster']['config']
  mode: 'mock' | 'http'
  generatedAt: string
  frontier: TournamentState['frontier']
  done: boolean
  blocked?: string
  counts: { entrants: number; Q: number; K: number; E: number; N: number; ko: number }
  players: PlayerRow[]
  pairs: PairRow[]
  prelim: {
    skipped: boolean
    rounds: number
    groups: { id: string; players: string[]; rounds: BracketCell[][]; winner?: string | null }[]
  }
  swiss: {
    rounds: {
      round: number
      pairs: string[]
      bye: string | null
      // [id, score, buchholz, weighted, actualWins, rank, tie, record]
      standings: [string, number, number, number, number, number, string, string][]
    }[]
  }
  ko: { seeds: string[]; rounds: BracketCell[][]; champion?: string | null }
  decided: Record<Stage, Record<string, number>>
  rulings: { pairs: number; forfeits: number; standings: number }
  truth?: {
    koSize: number
    trueTopInKO: number
    trueTopInSwiss: number
    trueNo1: { id: string; finish: string; placement?: number }
    champion?: { id: string; trueRank: number }
    spearman: number
    trueTop: { id: string; trueRank: number; finish: string; placement?: number }[]
  }
}

const KO_FINISH = ['冠军', '亚军', '4强', '8强', '16强', '32强', '64强', '128强']

const cell = (m: BracketMatch): BracketCell => [m.p, m.q, m.pairID ?? null, m.winner]

export function buildReport(
  t: TournamentDir,
  state: TournamentState,
  mode: 'mock' | 'http',
  truth?: Map<string, TruthEntry>,
): ScenarioReport {
  const { roster } = t
  const rows = new Map<string, PlayerRow>(roster.players.map((p) => [p.id, {
    id: p.id,
    ...(p.name ? { name: p.name } : {}),
    ladderRank: p.ladderRank,
    direct: p.direct,
    tokensA: p.a.tokens,
    tokensB: p.b.tokens,
    finish: p.direct ? '瑞士轮' : '海选',
  }]))
  for (const w of t.withdrawals) {
    rows.get(w.player)!.withdrawn = `${w.stage} r${w.round}: ${w.reason}`
  }

  // 海选 finishes: out in round k of the group bracket.
  for (const group of state.prelim.groups) {
    for (const id of group.players) rows.get(id)!.group = group.id
    for (const round of group.rounds) {
      for (const m of round) {
        if (m.winner === undefined) continue
        for (const id of [m.p, m.q]) {
          if (id && id !== m.winner) rows.get(id)!.finish = `海选第${m.round}轮`
        }
      }
    }
  }
  state.swiss.seeds?.forEach((id, i) => {
    const row = rows.get(id)!
    row.swissSeed = i + 1
    row.finish = '瑞士轮'
  })
  const final = state.swiss.final ?? []
  for (const s of final) rows.get(s.id)!.swissPosition = s.position

  // Placements: knockout finishes first, then the rest of the Swiss table by
  // position, then 海选 exits by how far they got. Ties share the best place.
  const koRounds = state.ko.rounds.length
  const koFinish = new Map<string, number>() // depth: 0 = champion
  state.ko.seeds?.forEach((id, i) => {
    rows.get(id)!.koSeed = i + 1
    koFinish.set(id, Math.log2(state.ko.seeds!.length > 1 ? nextPow(state.ko.seeds!.length) : 1))
  })
  for (const round of state.ko.rounds) {
    for (const m of round) {
      if (m.winner === undefined) continue
      if (m.winner) koFinish.set(m.winner, koRounds - m.round)
    }
  }
  if (state.done) {
    for (const [id, depth] of koFinish) {
      rows.get(id)!.finish = KO_FINISH[depth] ?? `${2 ** depth}强`
      rows.get(id)!.placement = depth === 0 ? 1 : 2 ** (depth - 1) + 1
    }
    let place = koFinish.size + 1
    for (const s of final) {
      if (koFinish.has(s.id)) continue
      const row = rows.get(s.id)!
      row.placement = place++
      row.finish = `瑞士轮第${s.position}名`
    }
    const prelimOut = [...rows.values()].filter((r) => r.placement === undefined)
    const depthOf = (r: PlayerRow) => Number(/海选第(\d+)轮/.exec(r.finish)?.[1] ?? 0)
    prelimOut.sort((x, y) => depthOf(y) - depthOf(x))
    for (let i = 0; i < prelimOut.length;) {
      let j = i
      while (j < prelimOut.length && depthOf(prelimOut[j]) === depthOf(prelimOut[i])) j++
      for (let k = i; k < j; k++) prelimOut[k].placement = place
      place += j - i
      i = j
    }
  }

  const pairs: PairRow[] = [...state.pairs.values()].map((p) => ({
    id: p.id,
    stage: p.stage,
    round: p.round,
    p: p.p,
    q: p.q,
    status: p.status,
    ...(p.winner ? { winner: p.winner, by: p.decidedBy } : {}),
    winsP: p.winsP,
    winsQ: p.winsQ,
    ...(p.primaryP !== undefined ? { primaryP: p.primaryP, primaryQ: p.primaryQ } : {}),
    tokensP: p.tokensP,
    tokensQ: p.tokensQ,
    ...(p.note ? { note: p.note } : {}),
    games: p.games.map((g) => [
      g.slot,
      g.matchID,
      g.status,
      g.winner,
      g.scoreA,
      g.scoreB,
      g.scheme ?? null,
      g.attempts,
    ]),
  }))

  const decided: ScenarioReport['decided'] = { prelim: {}, swiss: {}, ko: {} }
  for (const p of state.pairs.values()) {
    const key = p.status === 'decided' ? p.decidedBy! : p.status
    decided[p.stage][key] = (decided[p.stage][key] ?? 0) + 1
  }
  decided.swiss.bye = state.swiss.rounds.filter((r) => r.bye && r.standings).length
  let prelimByes = 0
  for (const g of state.prelim.groups) {
    for (const round of g.rounds) {
      for (const m of round) if (!m.pairID && (m.p || m.q)) prelimByes++
    }
  }
  decided.prelim.bye = prelimByes

  const N = state.swiss.seeds?.length ?? 0
  const report: ScenarioReport = {
    scenarioID: roster.scenarioID,
    tournament: roster.tournament,
    seed: roster.seed,
    config: roster.config,
    mode,
    generatedAt: new Date().toISOString(),
    frontier: state.frontier,
    done: state.done,
    ...(state.blocked ? { blocked: state.blocked } : {}),
    counts: {
      entrants: roster.players.length,
      Q: roster.players.filter((p) => !p.direct).length,
      K: roster.players.filter((p) => p.direct).length,
      E: state.prelim.advancers?.length ?? 0,
      N,
      ko: state.ko.seeds?.length ?? 0,
    },
    players: [...rows.values()],
    pairs,
    prelim: {
      skipped: state.prelim.skipped,
      rounds: state.prelim.rounds,
      groups: state.prelim.groups.map((g) => ({
        id: g.id,
        players: g.players,
        rounds: g.rounds.map((r) => r.map(cell)),
        ...(g.winner !== undefined ? { winner: g.winner } : {}),
      })),
    },
    swiss: {
      rounds: state.swiss.rounds.map((r) => ({
        round: r.round,
        pairs: r.pairs,
        bye: r.bye,
        standings: (r.standings ?? []).map((s) => [
          s.id,
          s.score,
          s.buchholz,
          s.weighted,
          s.actualWins,
          s.rank,
          s.tie ?? '',
          s.record,
        ]),
      })),
    },
    ko: {
      seeds: state.ko.seeds ?? [],
      rounds: state.ko.rounds.map((r) => r.map(cell)),
      ...(state.ko.champion !== undefined ? { champion: state.ko.champion } : {}),
    },
    decided,
    rulings: {
      pairs: Object.keys(t.rulings.pairs ?? {}).length,
      forfeits: Object.keys(t.rulings.forfeits ?? {}).length,
      standings: (t.rulings.standings ?? []).length,
    },
  }

  if (truth) report.truth = truthPanel(report, truth)
  return report
}

function nextPow(n: number): number {
  let s = 1
  while (s < n) s *= 2
  return s
}

function truthPanel(
  report: ScenarioReport,
  truth: Map<string, TruthEntry>,
): ScenarioReport['truth'] {
  const byStrength = report.players.slice()
    .sort((x, y) => (truth.get(y.id)?.strength ?? 0) - (truth.get(x.id)?.strength ?? 0))
  byStrength.forEach((p, i) => {
    p.trueRank = i + 1
    p.strength = Math.round((truth.get(p.id)?.strength ?? 0) * 1000) / 1000
  })
  const koSize = report.config.koSize
  const ko = new Set(report.ko.seeds)
  const swiss = new Set(report.players.filter((p) => p.swissSeed).map((p) => p.id))
  const top = byStrength.slice(0, koSize)
  const champion = report.ko.champion
    ? report.players.find((p) => p.id === report.ko.champion)
    : undefined
  return {
    koSize,
    trueTopInKO: top.filter((p) => ko.has(p.id)).length,
    trueTopInSwiss: top.filter((p) => swiss.has(p.id)).length,
    trueNo1: {
      id: byStrength[0].id,
      finish: byStrength[0].finish,
      ...(byStrength[0].placement ? { placement: byStrength[0].placement } : {}),
    },
    ...(champion ? { champion: { id: champion.id, trueRank: champion.trueRank! } } : {}),
    spearman: spearman(
      report.players.filter((p) => p.placement !== undefined)
        .map((p) => [p.trueRank!, p.placement!]),
    ),
    trueTop: byStrength.slice(0, 16).map((p) => ({
      id: p.id,
      trueRank: p.trueRank!,
      finish: p.finish,
      ...(p.placement ? { placement: p.placement } : {}),
    })),
  }
}

// Spearman's rho with average ranks for ties.
export function spearman(pairs: [number, number][]): number {
  if (pairs.length < 2) return 0
  const ranks = (values: number[]) => {
    const order = values.map((v, i) => [v, i] as const).sort((a, b) => a[0] - b[0])
    const out = new Array<number>(values.length)
    for (let i = 0; i < order.length;) {
      let j = i
      while (j < order.length && order[j][0] === order[i][0]) j++
      const avg = (i + j - 1) / 2 + 1
      for (let k = i; k < j; k++) out[order[k][1]] = avg
      i = j
    }
    return out
  }
  const x = ranks(pairs.map((p) => p[0]))
  const y = ranks(pairs.map((p) => p[1]))
  const mean = (v: number[]) => v.reduce((s, a) => s + a, 0) / v.length
  const mx = mean(x)
  const my = mean(y)
  let num = 0
  let dx = 0
  let dy = 0
  for (let i = 0; i < x.length; i++) {
    num += (x[i] - mx) * (y[i] - my)
    dx += (x[i] - mx) ** 2
    dy += (y[i] - my) ** 2
  }
  return Math.round((num / Math.sqrt(dx * dy)) * 1000) / 1000
}

// Truth per player from the mock server's versions.
export function mockTruth(
  t: TournamentDir,
  version: (id: number) => { truth: { skill: number; talent: number } } | undefined,
): Map<string, TruthEntry> {
  const out = new Map<string, TruthEntry>()
  for (const p of t.roster.players) {
    const a = version(p.a.versionID)
    const b = version(p.b.versionID)
    if (!a || !b) continue
    out.set(p.id, {
      strength: (a.truth.skill + b.truth.skill) / 2,
      talent: a.truth.talent,
    })
  }
  return out
}
