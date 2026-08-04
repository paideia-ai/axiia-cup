// The scenario API, as the server's prelude injects it. Scenario scripts are
// plain scripts, not modules, so everything here is global: no import needed.

type Side = 'a' | 'b'

type MatchWinner = 'a' | 'b' | 'draw'

// A plain JS object literal widens 'a' to string before anything can pin it down,
// so fields the host reads back out of `meta` or out of main's result take the
// widened form. The union still drives editor completion; the server is what
// finally rejects a value outside it.
type SideValue = Side | (string & Record<never, never>)

type WinnerValue = MatchWinner | (string & Record<never, never>)

interface ScenarioChannel {
  id: string
  label: string
}

interface ScenarioStage {
  id: string
  title: string
  channels?: ScenarioChannel[]
}

interface PresetOpponent {
  key: string
  side: SideValue
  label: string
  prompt: string
  modelID: string
  options?: SideOptions
}

interface ScenarioMeta {
  id: string
  title: string
  subject: string
  sideAName: string
  sideBName: string
  sideALabel?: string
  sideBLabel?: string
  turnCount?: number
  stages?: ScenarioStage[]
  presets?: PresetOpponent[]
  speakerLabels?: Record<string, string>
}

interface ScenarioResult {
  winner?: WinnerValue
  scoreA: number
  scoreB: number
  reasoning?: string
}

type ScenarioMain = () => Promise<ScenarioResult>

// Operator-supplied JSON for the slot. Untyped by construction: the scenario
// decides what it reads and what it defaults to.
interface ScenarioParams {
  // deno-lint-ignore no-explicit-any
  readonly [key: string]: any
}

// The player's own JSON blob for one side, already parsed; `null` when the player
// set none. Opaque to the server and untyped by construction, exactly like params:
// the vocabulary is the scenario's own.
interface SideOptions {
  // deno-lint-ignore no-explicit-any
  readonly [key: string]: any
}

interface SideBinding {
  readonly prompt: string
  readonly model: string
  readonly label: string
  readonly options: SideOptions | null
}

interface SayReply {
  readonly text: string
  readonly reasoning: string
  readonly affordance: string | null
}

interface ActReply {
  readonly text: string
  readonly reasoning: string
  readonly fields: Readonly<Record<string, string>>
}

interface ActField {
  enum?: readonly string[]
  hint?: string
  long?: boolean
}

interface ActSpec {
  prompt?: string
  key?: string
  channel?: string
  fields?: Record<string, ActField>
}

interface SayOptions {
  channel?: string
}

interface ActOptions {
  key?: string
  channel?: string
}

interface AgentAffordance {
  prompt: string
  once?: boolean
  handler: () => string | void
}

interface TurnOptions {
  channel?: string
  affordances?: Record<string, AgentAffordance>
}

interface AgentConfig {
  system?: string
  model?: string
  effort?: string
  side?: Side
}

interface Agent {
  readonly name: string
  push(text: string): void
  hear(speaker: string, text: string): void
  say(options?: SayOptions): Promise<SayReply>
  act(spec: ActSpec, options?: ActOptions): Promise<ActReply>
  turn(options?: TurnOptions): Promise<SayReply>
}

interface Game {
  readonly params: ScenarioParams
  side(which: Side): SideBinding
  playerPrompt(which: Side): string
  agent(name: string, config?: AgentConfig): Agent
  emit(channel: string, event?: unknown): void
  phase(title: string): void
  random(): Promise<number>
}

declare const game: Game

// Confiscated by the prelude: calling any of these throws at run time. TypeScript
// cannot subtract a member from the standard library, so these cannot be made
// type errors; `deno task validate` greps for them instead.
