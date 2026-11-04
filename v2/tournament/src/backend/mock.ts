// A mock axiia server in one JSON file. It holds agent versions (with the
// latent truth behind each one), accepts batch submits with the real
// contract's checks, and plays queued games with the mock strength model
// whenever it is opened again (`tick`), so `next` sees a round finish
// between two runs exactly as it would against the real server.

import { random } from '../rng.ts'
import { logit, playGame } from '../mock/model.ts'
import {
  isScenarioID,
  type MatchRecord,
  type Side,
  type SubmitItem,
  type SubmitResult,
  type VersionInfo,
} from '../types.ts'
import type { Backend } from './backend.ts'

export const MOCK_FORMAT = 'axiia-mock-server/1'

export interface MockTruth {
  player: string
  name: string
  talent: number
  skill: number // a or b, for this version's side
  w: [number, number]
}

export interface MockVersion {
  versionID: number
  agentID: number
  accountID: number
  scenarioID: string
  side: Side
  tokens: number
  truth: MockTruth
}

export interface MockFile {
  format: typeof MOCK_FORMAT
  // Chance that a game fails (judge timeout, provider error) and needs a retry.
  failRate: number
  nextMatchID: number
  nextVersionID: number
  nextAccountID: number
  versions: Record<string, MockVersion>
  matches: MatchRecord[]
}

export function emptyMockFile(failRate = 0.01): MockFile {
  return {
    format: MOCK_FORMAT,
    failRate,
    nextMatchID: 1,
    nextVersionID: 1,
    nextAccountID: 1,
    versions: {},
    matches: [],
  }
}

// A prompt whose cl100k_base count is exactly `tokens`: "alpha" then
// " alpha" repeated, one token each.
export function mockPrompt(tokens: number): string {
  return tokens <= 0 ? '' : 'alpha' + ' alpha'.repeat(tokens - 1)
}

export class MockBackend implements Backend {
  readonly mode = 'mock' as const
  readonly maxInFlight = Infinity
  readonly path: string
  data: MockFile
  #byKey: Map<string, MatchRecord>

  private constructor(path: string, data: MockFile) {
    this.path = path
    this.data = data
    this.#byKey = new Map(data.matches.map((m) => [m.key, m]))
  }

  // Opens the file (or starts an empty server) and, unless tick is false,
  // plays every game that was queued when it was last closed.
  static async open(
    path: string,
    { tick = true, create = false } = {},
  ): Promise<MockBackend> {
    let data: MockFile
    try {
      data = JSON.parse(await Deno.readTextFile(path))
    } catch (error) {
      if (!(error instanceof Deno.errors.NotFound) || !create) throw error
      data = emptyMockFile()
    }
    if (data.format !== MOCK_FORMAT) {
      throw new Error(`${path} is not a ${MOCK_FORMAT} file`)
    }
    const backend = new MockBackend(path, data)
    if (tick) backend.tick()
    return backend
  }

  addVersion(v: Omit<MockVersion, 'versionID'>): MockVersion {
    const version = { ...v, versionID: this.data.nextVersionID++ }
    this.data.versions[String(version.versionID)] = version
    return version
  }

  newAccountID(): number {
    return this.data.nextAccountID++
  }

  version(id: number): MockVersion | undefined {
    return this.data.versions[String(id)]
  }

  // Plays every queued game.
  tick(): number {
    let played = 0
    for (const m of this.data.matches) {
      if (m.status !== 'queued' && m.status !== 'running') continue
      const r = random(`mock-game/${m.key}/${m.seed ?? ''}`)
      if (r() < this.data.failRate) {
        Object.assign(m, { status: 'failed', error: 'mock: judge timed out' })
        continue
      }
      const a = this.version(m.a.versionID)!
      const b = this.version(m.b.versionID)!
      if (!isScenarioID(m.scenarioID)) throw new Error(m.scenarioID)
      const l = logit(m.scenarioID, a.truth, b.truth)
      const game = playGame(m.scenarioID, l, r)
      Object.assign(m, {
        status: 'finished',
        winner: game.winner,
        scoreA: game.scoreA,
        scoreB: game.scoreB,
        facts: game.facts ?? null,
      })
      played++
    }
    return played
  }

  submit(items: SubmitItem[]): Promise<SubmitResult[]> {
    // Validate the whole batch before writing anything.
    const seen = new Set<string>()
    for (const item of items) {
      if (!item.key) throw new Error('mock: item without key')
      if (seen.has(item.key)) throw new Error(`mock: duplicate key ${item.key}`)
      seen.add(item.key)
      if (item.tags.length > 16) throw new Error(`mock: >16 tags on ${item.key}`)
      for (const side of ['a', 'b'] as const) {
        const v = this.version(item[side].versionID)
        if (!v) {
          throw new Error(`mock: unknown version ${item[side].versionID}`)
        }
        if (v.scenarioID !== item.scenarioID || v.side !== side) {
          throw new Error(
            `mock: version ${v.versionID} is ${v.scenarioID}/${v.side}, not ${item.scenarioID}/${side}`,
          )
        }
      }
    }
    const out: SubmitResult[] = []
    for (const item of items) {
      const existing = this.#byKey.get(item.key)
      if (existing) {
        out.push({ key: item.key, matchID: existing.matchID, created: false })
        continue
      }
      const side = (id: number) => {
        const v = this.version(id)!
        return { versionID: id, agentID: v.agentID, accountID: v.accountID }
      }
      const match: MatchRecord = {
        matchID: this.data.nextMatchID++,
        key: item.key,
        scenarioID: item.scenarioID,
        tags: item.tags.slice(),
        seed: item.seed ?? null,
        status: 'queued',
        a: side(item.a.versionID),
        b: side(item.b.versionID),
        winner: null,
        scoreA: null,
        scoreB: null,
        facts: null,
        error: null,
      }
      this.data.matches.push(match)
      this.#byKey.set(match.key, match)
      out.push({ key: item.key, matchID: match.matchID, created: true })
    }
    return Promise.resolve(out)
  }

  query(tags: string[]): Promise<MatchRecord[]> {
    return Promise.resolve(
      this.data.matches
        .filter((m) => tags.every((t) => m.tags.includes(t)))
        .map((m) => structuredClone(m)),
    )
  }

  versions(ids: number[]): Promise<VersionInfo[]> {
    return Promise.resolve(
      ids.map((id) => this.version(id)).filter((v): v is MockVersion => !!v)
        .map((v) => ({
          versionID: v.versionID,
          agentID: v.agentID,
          accountID: v.accountID,
          scenarioID: v.scenarioID,
          side: v.side,
          prompt: mockPrompt(v.tokens),
        })),
    )
  }

  async close(): Promise<void> {
    await Deno.writeTextFile(this.path, JSON.stringify(this.data))
  }
}
