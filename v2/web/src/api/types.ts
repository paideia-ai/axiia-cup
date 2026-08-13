// Hand-written mirror of the Swift AxiiaContract target (packages/axiia/Targets/
// AxiiaContract). Wire keys are the verbatim Swift property names — no snake_case,
// no CodingKeys renames. Swift Optionals encode as absent keys, so every optional
// tolerates both `undefined` and `null`. TS emission from the Swift contract is a
// queued follow-up; keep this the single source module so the generated file drops
// in here unchanged.

export type Side = 'a' | 'b'

// ── AccountDTOs ─────────────────────────────────────────────────────────────

export interface SignupRequest {
  code: string
  email?: string | null
  phone?: string | null
  password: string
  displayName: string
}

export interface LoginRequest {
  email: string
  password: string
}

export interface ElevateRequest {
  code: string
}

export interface AccountDTO {
  id: string
  email?: string | null
  phone?: string | null
  displayName: string
  isAdmin: boolean
  hasTOTP: boolean
}

export interface MeResponse {
  account: AccountDTO
  elevated: boolean
}

// ── CatalogDTOs ─────────────────────────────────────────────────────────────

export interface ScenarioSummary {
  id: string
  title: string
  subject: string
  sideAName: string
  sideBName: string
  sideALabel: string
  sideBLabel: string
  turnCount: number
  // #65: true only when BOTH sides meet the per-side trial threshold.
  gateUnlocked: boolean
  // Additive (G12): per-side progress toward that threshold; absent on a
  // pre-P2 server.
  gateProgress?: GateProgressDTO | null
}

export interface ChannelDTO {
  id: string
  label: string
}

// The generic presentation unit: the transcript is grouped by stage and channel
// without the SPA knowing any scenario.
export interface StageDTO {
  id: string
  title: string
  channels: ChannelDTO[]
}

export interface PresetOpponentDTO {
  key: string
  side: string
  label: string
  modelID: string
  // The scenario-private blob this bot is cast with; opaque to the server, and
  // absent on a scenario whose presets declare none.
  options?: JSONValue | string | null
}

export interface ScenarioDetail {
  summary: ScenarioSummary
  stages: StageDTO[]
  presets: PresetOpponentDTO[]
}

export interface ScenarioListResponse {
  scenarios: ScenarioSummary[]
}

export interface ModelDTO {
  id: string
  label: string
}

export interface ModelListResponse {
  models: ModelDTO[]
}

// A fieldable opponent agent for friendly PVP; `isSelf` marks your own
// opposite-side agent, which makes the match a hotseat.
export interface OpponentAgentDTO {
  agentID: number
  displayName: string
  isSelf: boolean
}

export interface OpponentListResponse {
  opponents: OpponentAgentDTO[]
}

// ── ConfigDTOs ──────────────────────────────────────────────────────────────

// The read-only client projection behind GET /v1/config (RFC §5 P2).
export interface ConfigResponse {
  dailyBattleLimit: number
  pvpDailyLimit: number
  concurrencyLimit: number
  // Per-side threshold (#65): distinct presets to beat on EACH side for pvp.
  pvpUnlockPerSideWins: number
  statsDisplayThreshold: number
  promptUnitLimit: number
  expressPreset?: ExpressPresetDTO | null
  // The same list GET /v1/models serves.
  models: ModelDTO[]
  visibility: VisibilityDTO
  opponentDailyChallengeLimit: number
  trialsBlocked: boolean
  usage: UsageDTO
}

export interface ExpressPresetDTO {
  scenarioID: string
  side: string
  presetKey: string
}

// Spec #20's three owner-only surfaces, named for clients so the restriction
// list is data, not lore.
export interface VisibilityDTO {
  ownerOnly: string[]
}

// The calling user's consumption against the daily quotas (UTC+8 day, R16).
export interface UsageDTO {
  battlesToday: number
  pvpBattlesToday: number
}

// Per-side trial progress (G12/#65): distinct presets beaten vs the threshold.
export interface GateSideProgressDTO {
  beaten: number
  needed: number
}

export interface GateProgressDTO {
  a: GateSideProgressDTO
  b: GateSideProgressDTO
}

// One of the caller's agents in the GET /v1/my/agents inventory. Names arrive
// in P6; until then an agent is identified by its scenario/side position.
export interface MyAgentDTO {
  agentID: number
  versionCount: number
  entryVersionID?: number | null
  latestVersionID?: number | null
}

// A side with no agent yet is an empty array, never an absent key.
export interface SideAgentsDTO {
  a: MyAgentDTO[]
  b: MyAgentDTO[]
}

export interface MyAgentsScenarioDTO {
  scenarioID: string
  title: string
  sides: SideAgentsDTO
  gateProgress: GateProgressDTO
  // #58: both sides hold an entry-flagged version.
  entryReady: boolean
}

export interface MyAgentsResponse {
  scenarios: MyAgentsScenarioDTO[]
}

// ── SubmissionDTOs (builder) ────────────────────────────────────────────────

export interface EnsureAgentRequest {
  scenarioID: string
  side: string
}

export interface AgentRefResponse {
  agentID: number
}

export interface FieldMutationRequest {
  field: string
  value: string
}

// `options` is a JSON-encoded string the server stores and hands back to the
// script untouched; its vocabulary is the scenario's own (see src/scenarios).
// Omitting it is always valid, and a scenario the SPA has no module for never
// sends it.
export interface SaveVersionRequest {
  prompt: string
  modelID: string
  parentVersionID?: number | null
  options?: string | null
}

export interface AgentVersionDTO {
  id: number
  agentID: number
  prompt: string
  modelID: string
  parentVersionID?: number | null
  isEntry: boolean
  snapshotSeq: number
  options?: string | null
}

export interface DraftResponse {
  fields: Record<string, string>
  scenarioID: string
  side: Side
}

export interface VersionListResponse {
  versions: AgentVersionDTO[]
  entryVersionID?: number | null
}

export interface VersionDiffResponse {
  base: AgentVersionDTO
  head: AgentVersionDTO
}

// Swift enum with associated values → single-key discriminated object.
export type BuilderEventDTO =
  | {
    fieldMutated: {
      agentID: number
      field: string
      value: string
      seq: number
    }
  }
  | { versionCreated: { agentID: number; versionID: number } }

// ── MatchDTOs ───────────────────────────────────────────────────────────────

export interface DispatchPVERequest {
  versionID: number
  presetKey: string
}

export interface DispatchPVPRequest {
  versionID: number
  opponentAgentID: number
}

export interface DispatchResponse {
  matchID: number
}

export type TurnKind = 'dialogue' | 'event'

// Any JSON the script emitted; the emit vocabulary is per-scenario content.
export type JSONValue =
  | null
  | boolean
  | number
  | string
  | JSONValue[]
  | { [key: string]: JSONValue }

// One ordered timeline row. `dialogue` carries speech in `finalText` with the
// model trace in `reasoning`; `event` carries the script's `game.emit` payload in
// `event` and leaves `finalText` empty.
export interface TurnDTO {
  seq: number
  channel: string
  kind: TurnKind
  speaker: string
  finalText: string
  reasoning?: string | null
  event?: JSONValue | null
  promptTokens?: number | null
  completionTokens?: number | null
  cost?: number | null
  ttftMs?: number | null
  finishReason?: string | null
}

export interface MatchSummary {
  id: number
  scenarioID: string
  scenarioTitle: string
  kind: string
  dispatched: boolean
  finished: boolean
  scored: boolean
  winner?: string | null
}

// `output` is the program validator's normalized JSON, carried as a string.
// `afterSeq` is the transcript position it settled at: it was decided on the
// first `afterSeq` committed rows, so it belongs after them in the timeline.
export interface VerdictDTO {
  key: string
  afterSeq: number
  output: string
  model: string
}

export interface MatchDetail {
  summary: MatchSummary
  currentTurn: number
  turns: TurnDTO[]
  verdicts: VerdictDTO[]
  scoreA?: number | null
  scoreB?: number | null
  reasoning?: string | null
  error?: string | null
  stages: StageDTO[]
  // Every speaker key this transcript can carry — the two sides under their
  // scenario names, plus each NPC and event speaker.
  speakerLabels: Record<string, string>
}

export interface MatchListResponse {
  matches: MatchSummary[]
  open: boolean
}

// Swift enum with associated values → single-key discriminated object. SSE frames
// carry these unnamed (data: only); discriminate on the key.
export type MatchEventDTO =
  | {
    turnCompleted: {
      matchID: number
      seq: number
      channel: string
      kind: string
    }
  }
  | {
    chunk: {
      matchID: number
      seq: number
      channel: string
      speaker: string
      // 'thinking' | 'text' — the reasoning stream and the speech stream of the
      // same in-flight turn.
      phase: string
      delta: string
    }
  }
  | { verdictRecorded: { matchID: number; key: string } }
  | { matchFinished: { matchID: number; winner: string } }
  | { matchFailed: { matchID: number } }

// ── EngagementDTOs ──────────────────────────────────────────────────────────

export interface TournamentSummary {
  id: number
  scenarioID: string
  status: string
  currentRound: number
  totalRounds: number
}

export interface TournamentListResponse {
  tournaments: TournamentSummary[]
}

export interface StandingsEntryDTO {
  submissionID: number
  wins: number
  losses: number
  buchholz: number
  matchesPlayed: number
  winRate: number
  rank: number
}

export interface StandingsResponse {
  entries: StandingsEntryDTO[]
}

export interface NotificationDTO {
  id: number
  kind: string
  matchID?: number | null
  tournamentID?: number | null
  read: boolean
}

export interface NotificationsResponse {
  notifications: NotificationDTO[]
  unreadCount: number
}

export interface BellEventDTO {
  unreadCount: number
}

// ── AdminDTOs ───────────────────────────────────────────────────────────────

export interface CreateRegistrationCodeRequest {
  code: string
  uses: number
}

export interface IDResponse {
  id: number
}

export interface OKResponse {
  ok: boolean
}

export interface ErrorResponse {
  error: string
  message: string
}

export interface RefreshTokenRequest {
  refreshToken: string
}

export interface RefreshTokenResponse {
  accessToken: string
  refreshToken: string
  accessExpiresAt: number
}

// ── ScriptDTOs ──────────────────────────────────────────────────────────────

export interface CreateScriptRequest {
  source: string
}

export interface ScriptRefResponse {
  sha: string
}

export interface ScriptResponse {
  sha: string
  source: string
  createdAt: number
}

export interface SlotDTO {
  id: string
  title: string
  scriptSHA: string
  params: JSONValue
  status: string
}

export interface SlotListResponse {
  slots: SlotDTO[]
}

export interface UpdateSlotRequest {
  scriptSHA?: string | null
  title?: string | null
  params?: JSONValue | null
  status?: string | null
}
