import type {
  AgentVersionDTO,
  DraftResponse,
  MyAgentsResponse,
  ScenarioDetail,
  Side,
} from '../api/types'
import { config, scenario as courtScenario } from '../testing/v34-fixtures'
import {
  catalogFixtures,
  matchFixtures,
  standingsFixture,
  tournamentFixtures,
} from './browse-fixtures'
import { fillExampleStrategies, seedAgents } from './model'

// Only fixture data is carried over from the old demo. Every page, control,
// routing transition and prompt helper is rendered by latest-main components.
interface DemoAgent {
  id: number
  name: string | null
  scenario: string
  side: Side
  fields: Record<string, string>
  versions: AgentVersionDTO[]
}
const key = 'axiia-main-style-demo-28cf870-v1'
const models = [
  { id: 'glm-5.3-flash', label: 'GLM-5.3 Flash' },
  { id: 'kimi-k2.6', label: 'Kimi K2.6' },
  { id: 'deepseek-v3.2', label: 'DeepSeek V3.2' },
]
function initial(): DemoAgent[] {
  let versionID = 1000
  return fillExampleStrategies(seedAgents()).map((a, index) => {
    const id = a.id > 0 ? a.id : 300 + index
    const versions = a.versions.map((v, i) => ({
      ...v,
      id: ++versionID,
      agentID: id,
      modelID: models[0].id,
      ordinal: i + 1,
      isEntry: a.entrySelectionUnknown
        ? i === a.versions.length - 1
        : v.isEntry,
    }))
    return {
      id,
      name: a.name || null,
      scenario: a.scenario,
      side: a.side === 0 ? 'a' : 'b',
      fields: { prompt: a.draft || versions.at(-1)?.prompt || '' },
      versions,
    }
  })
}
function load(): DemoAgent[] {
  try {
    const stored = JSON.parse(localStorage.getItem(key) ?? 'null')
    if (
      Array.isArray(stored) &&
      stored.every((a) =>
        typeof a.id === 'number' && a.fields && Array.isArray(a.versions)
      )
    ) return stored
  } catch { /* A storage failure still permits an in-memory demo. */ }
  return initial()
}
const state = load()
function persist() {
  try {
    localStorage.setItem(key, JSON.stringify(state))
  } catch { /* Session-only fallback. */ }
}
function inventory(): MyAgentsResponse {
  return {
    scenarios: catalogFixtures.map((s) => {
      const list = (side: Side) =>
        state.filter((a) => a.scenario === s.id && a.side === side).map((
          a,
        ) => ({
          agentID: a.id,
          name: a.name || null,
          versionCount: a.versions.length,
          entryVersionID: a.versions.find((v) => v.isEntry)?.id ?? null,
          latestVersionID: a.versions.at(-1)?.id ?? null,
        }))
      const sides = { a: list('a'), b: list('b') }
      return {
        scenarioID: s.id,
        title: s.title,
        sides,
        gateProgress: s.gateProgress!,
        entryReady: sides.a.some((a) => a.entryVersionID != null) &&
          sides.b.some((a) => a.entryVersionID != null),
      }
    }),
  }
}
function detail(id: string): ScenarioDetail | null {
  const summary = catalogFixtures.find((s) => s.id === id)
  if (!summary) return null
  return {
    summary,
    stages: courtScenario.stages,
    presets: (['a', 'b'] as const).map((side) => ({
      side,
      key: `demo-${side}`,
      label: `示例预设（${
        side === 'a' ? summary.sideAName : summary.sideBName
      }）`,
      modelID: models[0].id,
    })),
  }
}
// The product's SSE consumers run unchanged; demo streams emit local draft
// confirmations only. No socket or remote stream is opened.
class DemoStream extends EventTarget {
  static CONNECTING = 0
  static OPEN = 1
  static CLOSED = 2
  readonly CONNECTING = 0
  readonly OPEN = 1
  readonly CLOSED = 2
  readonly withCredentials = false
  readyState = 1
  onopen: ((e: Event) => void) | null = null
  onmessage: ((e: MessageEvent) => void) | null = null
  onerror: ((e: Event) => void) | null = null
  static streams = new Set<DemoStream>()
  constructor(readonly url: string) {
    super()
    DemoStream.streams.add(this)
    queueMicrotask(() => {
      if (this.readyState === 1) this.onopen?.(new Event('open'))
    })
  }
  close() {
    this.readyState = 2
    DemoStream.streams.delete(this)
  }
  static emit(agentID: number, payload: unknown) {
    for (const stream of this.streams) {
      if (stream.url.includes(`/agents/${agentID}/stream`)) {
        const event = new MessageEvent('message', {
          data: JSON.stringify(payload),
        })
        stream.onmessage?.(event)
        stream.dispatchEvent(event)
      }
    }
  }
}
export function installDemoAPI() {
  globalThis.EventSource = DemoStream as unknown as typeof EventSource
  const nativeFetch = globalThis.fetch.bind(globalThis)
  globalThis.fetch = async (input, init) => {
    const url = new URL(
      input instanceof Request ? input.url : String(input),
      location.href,
    )
    if (!/(^|\/)v1(?:\/|$)/.test(url.pathname)) return nativeFetch(input, init)
    const path = url.pathname.slice(url.pathname.indexOf('/v1') + 3)
    const method = init?.method ??
      (input instanceof Request ? input.method : 'GET')
    const body = init?.body ? JSON.parse(String(init.body)) : {}
    const error = (message: string, status = 404) =>
      Response.json({ error: 'demo_fixture', message }, { status })
    const ok = () => {
      persist()
      return Response.json({ ok: true })
    }
    const me = {
      account: {
        id: 'demo-kesou',
        displayName: 'kesou',
        isAdmin: false,
        hasTOTP: false,
        email: 'demo@example.com',
      },
      elevated: false,
      firstBattleDone: true,
    }
    if (path === '/auth/me') return Response.json(me)
    if (path === '/auth/logout') return ok()
    if (path === '/notifications') {
      return Response.json({ unreadCount: 0, notifications: [] })
    }
    if (path === '/config') return Response.json({ ...config, models })
    if (path === '/models') return Response.json({ models })
    const mode = new URLSearchParams(location.search).get('fixture')
    if (mode === 'loading') return new Promise<Response>(() => {})
    await new Promise((resolve) => setTimeout(resolve, 60))
    if (mode === 'error') return error('暂时无法加载，请稍后重试。', 503)
    const empty = mode === 'empty'
    if (path === '/scenarios') {
      return Response.json({ scenarios: empty ? [] : catalogFixtures })
    }
    if (path === '/my/agents') {
      return Response.json(empty ? { scenarios: [] } : inventory())
    }
    if (path === '/matches' && method === 'GET') {
      return Response.json({
        matches: empty ? [] : matchFixtures.map((m) => m.summary),
        open: false,
      })
    }
    if (path === '/tournaments') {
      return Response.json({ tournaments: empty ? [] : tournamentFixtures })
    }
    const scene = path.match(/^\/scenarios\/([^/]+)$/)
    if (scene) {
      const value = detail(decodeURIComponent(scene[1]))
      return value ? Response.json(value) : error('场景不存在。')
    }
    const opponents = path.match(/^\/scenarios\/([^/]+)\/opponents$/)
    if (opponents) {
      return Response.json({
        opponents: state.filter((a) =>
          a.scenario === opponents[1] &&
          a.side !== url.searchParams.get('side') && a.versions.length
        ).map((a) => ({
          agentID: a.id,
          displayName: 'kesou',
          name: a.name || null,
          isSelf: true,
          ownerAccountID: 'demo-kesou',
        })),
      })
    }
    const match = path.match(/^\/matches\/(\d+)$/)
    if (match) {
      const value = matchFixtures.find((m) => m.summary.id === Number(match[1]))
      return value ? Response.json(value) : error('对战不存在。')
    }
    const standings = path.match(/^\/tournaments\/(\d+)\/standings$/)
    if (standings) {
      if (!tournamentFixtures.some((t) => t.id === Number(standings[1]))) {
        return error('锦标赛不存在。')
      }
      return Response.json(
        empty ? { entries: [] } : standingsFixture(Number(standings[1])),
      )
    }
    if (
      (path === '/agents' || path === '/agents/ensure') && method === 'POST'
    ) {
      if (!detail(body.scenarioID) || !['a', 'b'].includes(body.side)) {
        return error('场景或角色不存在。', 400)
      }
      const existing = state.find((a) =>
        a.scenario === body.scenarioID && a.side === body.side
      )
      if (path.endsWith('/ensure') && existing) {
        return Response.json({ agentID: existing.id })
      }
      const id = Math.max(400, ...state.map((a) => a.id)) + 1
      state.push({
        id,
        name: body.name ?? '',
        scenario: body.scenarioID,
        side: body.side,
        fields: { prompt: '' },
        versions: [],
      })
      persist()
      return Response.json({ agentID: id })
    }
    const agent = path.match(/^\/agents\/(\d+)(.*)$/)
    if (agent) {
      const a = state.find((a) => a.id === Number(agent[1]))
      if (!a) return error('智能体不存在。')
      const endpoint = agent[2]
      if (endpoint === '/draft') {
        return Response.json(
          {
            fields: a.fields,
            scenarioID: a.scenario,
            side: a.side,
          } satisfies DraftResponse,
        )
      }
      if (endpoint === '/versions') {
        return Response.json({
          versions: a.versions,
          entryVersionID: a.versions.find((v) => v.isEntry)?.id ?? null,
        })
      }
      if (endpoint === '/diff') {
        const base = a.versions.find((v) =>
          v.id === Number(url.searchParams.get('base'))
        )
        const head = a.versions.find((v) =>
          v.id === Number(url.searchParams.get('head'))
        )
        return base && head
          ? Response.json({ base, head })
          : error('版本不存在。')
      }
      if (method === 'PATCH' && endpoint === '') {
        a.name = body.name ?? ''
        return ok()
      }
      if (method === 'DELETE' && endpoint === '') {
        if (a.versions.length) return error('有版本的智能体不能删除。', 409)
        state.splice(state.indexOf(a), 1)
        return ok()
      }
      if (method === 'POST' && endpoint === '/mutate') {
        a.fields[body.field] = body.value
        DemoStream.emit(a.id, {
          fieldMutated: { agentID: a.id, field: body.field, value: body.value },
        })
        return ok()
      }
      if (method === 'POST' && endpoint === '/save') {
        if (!body.prompt?.trim()) return error('策略不能为空。', 400)
        const id = Math.max(
          2000,
          ...state.flatMap((a) => a.versions.map((v) => v.id)),
        ) + 1
        const value: AgentVersionDTO = {
          ...body,
          id,
          agentID: a.id,
          ordinal: a.versions.length + 1,
          snapshotSeq: a.versions.length + 1,
          isEntry: false,
          createdAt: Math.floor(Date.now() / 1000),
        }
        a.versions.push(value)
        a.fields.prompt = value.prompt
        persist()
        return Response.json(value)
      }
      const entry = endpoint.match(/^\/entry\/(\d+)$/)
      if (method === 'POST' && entry) {
        if (!a.versions.some((v) => v.id === Number(entry[1]))) {
          return error('版本不存在。')
        }
        for (
          const sibling of state.filter((x) =>
            x.scenario === a.scenario && x.side === a.side
          )
        ) {
          for (const v of sibling.versions) {
            v.isEntry = v.id === Number(entry[1])
          }
        }
        return ok()
      }
    }
    return error('此演示未连接该操作。', 405)
  }
}
