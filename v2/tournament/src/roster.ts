// Building, validating and loading the locked roster of one scenario, plus
// the operator's input files next to it.
//
// A tournament directory holds:
//   roster.json       locked at the registration deadline (this file builds it)
//   rulings.json      组委会 rulings (optional)
//   withdrawals.json  withdrawals (optional)

import { nextPow2 } from './bracket.ts'
import { countTokens, sha256, TOKENIZER } from './tokens.ts'
import type { Backend } from './backend/backend.ts'
import {
  isScenarioID,
  type Player,
  type Roster,
  ROSTER_FORMAT,
  type Rulings,
  type ScenarioID,
  STAGE_ORDER,
  type TournamentConfig,
  type Withdrawal,
} from './types.ts'

export const DEFAULT_CONFIG: TournamentConfig = { K: 100, E: 256, R: 9, koSize: 64 }

// One registration: a player's two pinned versions and the ladder snapshot
// rank (absent/null = unranked).
export interface Entry {
  player?: string
  name?: string
  a: number
  b: number
  ladderRank?: number | null
}

export interface BuildOptions {
  entries: Entry[]
  scenarioID: ScenarioID
  tournament: string
  seed: string
  config?: Partial<TournamentConfig>
  backend: Backend
  lockedAt?: string
}

export class RosterError extends Error {
  constructor(readonly problems: string[]) {
    super(`roster invalid:\n  ${problems.join('\n  ')}`)
  }
}

// Fetches both versions of every entry, checks them, counts prompt tokens and
// picks the K direct entries (top K ladder ranks among valid entrants, which
// is the "顺延" of §5.1 once invalid registrations are left out).
export async function buildRoster(opts: BuildOptions): Promise<Roster> {
  const problems: string[] = []
  const ids = opts.entries.flatMap((e) => [e.a, e.b])
  const versions = new Map(
    (await opts.backend.versions(ids)).map((v) => [v.versionID, v]),
  )
  const players: Player[] = []
  for (const [i, entry] of opts.entries.entries()) {
    const label = entry.player ?? `entry ${i + 1}`
    const a = versions.get(entry.a)
    const b = versions.get(entry.b)
    const local: string[] = []
    if (!a) local.push(`${label}: version ${entry.a} not found`)
    if (!b) local.push(`${label}: version ${entry.b} not found`)
    if (a && (a.scenarioID !== opts.scenarioID || a.side !== 'a')) {
      local.push(
        `${label}: version ${a.versionID} is ${a.scenarioID}/${a.side}, not ${opts.scenarioID}/a`,
      )
    }
    if (b && (b.scenarioID !== opts.scenarioID || b.side !== 'b')) {
      local.push(
        `${label}: version ${b.versionID} is ${b.scenarioID}/${b.side}, not ${opts.scenarioID}/b`,
      )
    }
    if (a && b && a.accountID !== b.accountID) {
      local.push(`${label}: A and B versions belong to different accounts`)
    }
    problems.push(...local)
    if (local.length || !a || !b) continue
    players.push({
      id: entry.player ?? `acct-${a.accountID}`,
      ...(entry.name ? { name: entry.name } : {}),
      accountID: a.accountID,
      ladderRank: entry.ladderRank ?? null,
      direct: false,
      a: {
        versionID: a.versionID,
        agentID: a.agentID,
        tokens: countTokens(a.prompt),
        promptSHA256: await sha256(a.prompt),
      },
      b: {
        versionID: b.versionID,
        agentID: b.agentID,
        tokens: countTokens(b.prompt),
        promptSHA256: await sha256(b.prompt),
      },
    })
  }
  const config = { ...DEFAULT_CONFIG, ...opts.config }
  const ranked = players.filter((p) => p.ladderRank !== null)
    .sort((x, y) => x.ladderRank! - y.ladderRank!)
  for (const p of ranked.slice(0, config.K)) p.direct = true

  const roster: Roster = {
    format: ROSTER_FORMAT,
    tournament: opts.tournament,
    scenarioID: opts.scenarioID,
    seed: opts.seed,
    lockedAt: opts.lockedAt ?? new Date().toISOString(),
    tokenizer: TOKENIZER,
    config,
    players,
  }
  problems.push(...validateRoster(roster))
  if (problems.length) throw new RosterError(problems)
  return roster
}

// Structural checks; returns a list of problems (empty = valid).
export function validateRoster(roster: Roster): string[] {
  const problems: string[] = []
  if (roster.format !== ROSTER_FORMAT) problems.push(`format must be ${ROSTER_FORMAT}`)
  if (!isScenarioID(roster.scenarioID)) problems.push(`unknown scenario ${roster.scenarioID}`)
  if (!roster.tournament || /[\s#]/.test(roster.tournament)) {
    problems.push('tournament must be a non-empty tag prefix without spaces or #')
  }
  // Server limits keys, tags and seeds to 256 bytes; game keys and seeds are
  // built from these two plus at most ~40 bytes.
  const bytes = (s: string) => new TextEncoder().encode(s).length
  if (roster.tournament && bytes(roster.tournament) > 64) {
    problems.push('tournament must be at most 64 bytes')
  }
  if (!roster.seed) problems.push('seed is required (it is the public lottery seed)')
  else if (bytes(roster.seed) > 128) problems.push('seed must be at most 128 bytes')
  const { K, E, R, koSize } = roster.config ?? {}
  if (!(Number.isInteger(K) && K >= 0)) problems.push('config.K must be an integer ≥ 0')
  if (!(Number.isInteger(E) && E >= 1)) problems.push('config.E must be an integer ≥ 1')
  if (!(Number.isInteger(R) && R >= 1)) problems.push('config.R must be an integer ≥ 1')
  if (!(Number.isInteger(koSize) && koSize >= 2 && nextPow2(koSize) === koSize)) {
    problems.push('config.koSize must be a power of two ≥ 2')
  }
  const ids = new Set<string>()
  const accounts = new Set<number>()
  const versions = new Set<number>()
  const ranks = new Set<number>()
  for (const p of roster.players ?? []) {
    if (ids.has(p.id)) problems.push(`player ${p.id} appears twice`)
    ids.add(p.id)
    if (p.accountID !== undefined) {
      if (accounts.has(p.accountID)) problems.push(`account ${p.accountID} holds two entries`)
      accounts.add(p.accountID)
    }
    for (const side of ['a', 'b'] as const) {
      const v = p[side]
      if (!v || !Number.isInteger(v.versionID)) {
        problems.push(`${p.id}: ${side} versionID missing`)
        continue
      }
      if (versions.has(v.versionID)) problems.push(`version ${v.versionID} used twice`)
      versions.add(v.versionID)
      if (!(Number.isInteger(v.tokens) && v.tokens >= 0)) {
        problems.push(`${p.id}: ${side}.tokens must be a non-negative integer`)
      }
    }
    if (p.ladderRank !== null) {
      if (!(Number.isInteger(p.ladderRank) && p.ladderRank >= 1)) {
        problems.push(`${p.id}: ladderRank must be a positive integer or null`)
      } else if (ranks.has(p.ladderRank)) {
        problems.push(`ladder rank ${p.ladderRank} held twice`)
      }
      ranks.add(p.ladderRank)
    }
  }
  const ranked = (roster.players ?? []).filter((p) => p.ladderRank !== null)
    .sort((x, y) => x.ladderRank! - y.ladderRank!)
  const expected = new Set(ranked.slice(0, K).map((p) => p.id))
  for (const p of roster.players ?? []) {
    if (p.direct !== expected.has(p.id)) {
      problems.push(`${p.id}: direct must be ${expected.has(p.id)} (top ${K} ladder ranks)`)
    }
  }
  const N = expected.size + Math.min(E, (roster.players ?? []).length - expected.size)
  if (Number.isInteger(R) && N > 1 && R > N - 1) {
    problems.push(`R = ${R} rounds cannot avoid repeats with ${N} Swiss players`)
  }
  return problems
}

// Re-fetches every version and checks it still matches the locked roster:
// same scenario, side, account and the same prompt (by hash and count).
export async function verifyRosterAgainst(
  roster: Roster,
  backend: Backend,
): Promise<string[]> {
  const problems: string[] = []
  const ids = roster.players.flatMap((p) => [p.a.versionID, p.b.versionID])
  const versions = new Map((await backend.versions(ids)).map((v) => [v.versionID, v]))
  for (const p of roster.players) {
    for (const side of ['a', 'b'] as const) {
      const locked = p[side]
      const v = versions.get(locked.versionID)
      if (!v) {
        problems.push(`${p.id}: version ${locked.versionID} not on the server`)
        continue
      }
      if (v.scenarioID !== roster.scenarioID || v.side !== side) {
        problems.push(`${p.id}: version ${v.versionID} is ${v.scenarioID}/${v.side}`)
      }
      if (p.accountID !== undefined && v.accountID !== p.accountID) {
        problems.push(`${p.id}: version ${v.versionID} belongs to account ${v.accountID}`)
      }
      const tokens = countTokens(v.prompt)
      if (tokens !== locked.tokens) {
        problems.push(
          `${p.id}: ${side} prompt counts ${tokens} tokens, roster locked ${locked.tokens}`,
        )
      }
      if (locked.promptSHA256 && locked.promptSHA256 !== await sha256(v.prompt)) {
        problems.push(`${p.id}: ${side} prompt text changed since the roster was locked`)
      }
    }
  }
  return problems
}

export interface TournamentDir {
  dir: string
  roster: Roster
  rulings: Rulings
  withdrawals: Withdrawal[]
}

async function readOptional<T>(path: string, fallback: T): Promise<T> {
  try {
    return JSON.parse(await Deno.readTextFile(path)) as T
  } catch (error) {
    if (error instanceof Deno.errors.NotFound) return fallback
    throw new Error(`${path}: ${error instanceof Error ? error.message : error}`)
  }
}

export async function loadTournamentDir(dir: string): Promise<TournamentDir> {
  const roster = JSON.parse(await Deno.readTextFile(`${dir}/roster.json`)) as Roster
  const problems = validateRoster(roster)
  if (problems.length) throw new RosterError(problems)
  const rulings = await readOptional<Rulings>(`${dir}/rulings.json`, {})
  const withdrawals = await readOptional<Withdrawal[]>(`${dir}/withdrawals.json`, [])
  const ids = new Set(roster.players.map((p) => p.id))
  for (const w of withdrawals) {
    if (!ids.has(w.player)) throw new Error(`withdrawals.json: unknown player ${w.player}`)
    if (!(w.stage in STAGE_ORDER)) throw new Error(`withdrawals.json: bad stage ${w.stage}`)
    if (!(Number.isInteger(w.round) && w.round >= 1)) {
      throw new Error(`withdrawals.json: bad round for ${w.player}`)
    }
  }
  for (const s of rulings.standings ?? []) {
    for (const id of s.players) {
      if (!ids.has(id)) throw new Error(`rulings.json: unknown player ${id}`)
    }
  }
  return { dir, roster, rulings, withdrawals }
}
