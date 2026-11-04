// Shapes shared by the rules, the engine, the backends and the report.
// Rule references (§n) point at docs/competition/tournament-three-stage-rules.md.

export const SCENARIOS = [
  'shangyang-court',
  'honnoji-decision',
  'trolley-problem',
  'fengyiting-real',
] as const

export type ScenarioID = typeof SCENARIOS[number]

export function isScenarioID(value: unknown): value is ScenarioID {
  return typeof value === 'string' &&
    (SCENARIOS as readonly string[]).includes(value)
}

export type Stage = 'prelim' | 'swiss' | 'ko'

export const STAGE_ORDER: Record<Stage, number> = { prelim: 0, swiss: 1, ko: 2 }

export type Side = 'a' | 'b'

// --- roster -----------------------------------------------------------------

export interface SideEntry {
  versionID: number
  agentID?: number
  // tiktoken cl100k_base encode_ordinary count of the locked prompt (§4.2).
  tokens: number
  promptSHA256?: string
}

export interface Player {
  id: string
  name?: string
  accountID?: number
  // Ladder snapshot rank at the deadline; null = unranked (§5.1).
  ladderRank: number | null
  // One of the top-K ranked entrants: skips 海选 (§5.1).
  direct: boolean
  a: SideEntry
  b: SideEntry
}

export interface TournamentConfig {
  K: number // ladder direct entries
  E: number // 海选 advancers
  R: number // Swiss rounds
  koSize: number // 64
}

export const ROSTER_FORMAT = 'axiia-tournament-roster/1'

export interface Roster {
  format: typeof ROSTER_FORMAT
  tournament: string // tag prefix T
  scenarioID: ScenarioID
  // Public lottery seed: unranked draws and per-pair game seeds derive from it.
  seed: string
  lockedAt: string
  tokenizer: string
  config: TournamentConfig
  players: Player[]
}

export function totalTokens(player: Player): number {
  return player.a.tokens + player.b.tokens
}

// --- operator inputs ----------------------------------------------------------

export interface PairRuling {
  // Player id, or 'draw' (Swiss only, for a pair whose primary is unreadable).
  winner: string
  reason: string
  by?: string
  at?: string
}

export interface ForfeitRuling {
  // Player id awarded the walkover; null = both forfeit.
  winner: string | null
  reason: string
  by?: string
  at?: string
}

export interface StandingsRuling {
  // Fully tied Swiss players, in the order 组委会 placed them (§6.3).
  players: string[]
  reason: string
  by?: string
  at?: string
}

export interface Rulings {
  pairs?: Record<string, PairRuling>
  forfeits?: Record<string, ForfeitRuling>
  standings?: StandingsRuling[]
}

export interface Withdrawal {
  player: string
  // The player plays nothing from this stage/round on.
  stage: Stage
  round: number
  reason: string
}

// --- backend ------------------------------------------------------------------

export type MatchStatus = 'queued' | 'running' | 'finished' | 'failed'

export interface MatchSide {
  versionID: number
  agentID?: number
  accountID?: number
}

export interface MatchRecord {
  matchID: number
  key: string
  scenarioID: string
  tags: string[]
  seed?: string | null
  status: MatchStatus
  a: MatchSide
  b: MatchSide
  winner: 'a' | 'b' | 'draw' | null
  scoreA: number | null
  scoreB: number | null
  facts?: Record<string, unknown> | null
  error?: string | null
}

export interface SubmitItem {
  key: string
  scenarioID: string
  a: { versionID: number }
  b: { versionID: number }
  tags: string[]
  seed?: string
}

export interface SubmitResult {
  key: string
  matchID: number
  created: boolean
}

export interface VersionInfo {
  versionID: number
  agentID: number
  accountID: number
  scenarioID: string
  side: Side
  prompt: string
}

// --- derived state ------------------------------------------------------------

export type PairWinner = 'p' | 'q' | 'draw' | 'none'

export type DecidedBy =
  | 'games' // 2-0 (§2)
  | 'primary' // 1-1, scenario metric (§4.1)
  | 'secondary' // 1-1, primary tied, fewer prompt tokens (§4.2)
  | 'ruling' // 组委会 (§4.2 last paragraph)
  | 'draw' // Swiss 1-1 with primary tied (§6.2)
  | 'walkover' // withdrawal or forfeit ruling

export type PairStatus =
  | 'unsubmitted'
  | 'pending'
  | 'failed'
  | 'awaiting-ruling'
  | 'decided'

export interface GameView {
  slot: 'g1' | 'g2'
  key: string
  matchID: number
  status: MatchStatus
  winner: 'a' | 'b' | 'draw' | null
  scoreA: number | null
  scoreB: number | null
  scheme?: string
  error?: string | null
  attempts: number
}

export interface Pair {
  id: string
  stage: Stage
  round: number
  p: string
  q: string
  seed: string
  status: PairStatus
  // Present once decided.
  winner?: PairWinner
  decidedBy?: DecidedBy
  winsP: number
  winsQ: number
  // Primary metric for each player (§4.1). Numbers for the score/case
  // scenarios; 1/0 for fengyiting (放弃/继续 in the game that player won).
  primaryP?: number | null
  primaryQ?: number | null
  tokensP: number
  tokensQ: number
  note?: string
  games: GameView[]
}
