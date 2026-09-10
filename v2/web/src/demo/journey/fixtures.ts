import type {
  AgentVersionDTO,
  MatchDetail,
  MatchEventDTO,
  TurnDTO,
} from '../../api/types'
import { roleOfOptions, scenarioModule } from '../../scenarios'
import { createPreviewApi, scenario } from './builder-fixtures'

type StoredMatch = { id: number; startedAt: number; version: AgentVersionDTO }
type Store = { matches: StoredMatch[]; claimed: number[]; balance: number }
const KEY = 'axiia.sound-journey.matches.v1'
const base = createPreviewApi()
let store: Store = { matches: [], claimed: [], balance: 1000 }
try {
  const saved = JSON.parse(sessionStorage.getItem(KEY) ?? 'null')
  if (
    saved && Array.isArray(saved.matches) && Array.isArray(saved.claimed) &&
    typeof saved.balance === 'number'
  ) store = saved
} catch { /* Local preview state only. */ }
function persist() {
  try {
    sessionStorage.setItem(KEY, JSON.stringify(store))
  } catch { /* In-memory fallback. */ }
}
const lines = [
  [
    'a',
    '信长已将四国之事推向死局。今夜京都空虚，若再犹豫，连重新议价的余地都没有了。',
  ],
  [
    'b',
    '动兵之后，谁会承认这份承诺？先谈诸将的态度和家族的退路，再谈今夜的决断。',
  ],
  ['a', '元亲愿为殿下牵制西国。只要京都有变，四国就能成为呼应之势。'],
  [
    'b',
    '呼应不是盟约。没有明确的兵力、日期和联络人，不能让整支军队替一句承诺承担后果。',
  ],
  ['a', '若今夜不动，殿下又如何面对信长日后的猜疑？机会不会一直留在这里。'],
  [
    'b',
    '先保全军令，暂缓夜袭，把不满写成正式文书。留住军队和盟友，才有下一步可走。',
  ],
] as const
export function timeline(match: StoredMatch) {
  const events: { at: number; event: MatchEventDTO }[] = []
  lines.forEach(([speaker, text], i) => {
    const start = 700 + i * 2300
    const parts = text.match(/.{1,7}/gu) ?? []
    parts.forEach((delta, n) =>
      events.push({
        at: start + n * 130,
        event: {
          chunk: {
            matchID: match.id,
            seq: i,
            channel: 'council',
            speaker,
            phase: 'text',
            delta,
            call: 'say',
          },
        },
      })
    )
    events.push({
      at: start + 1800,
      event: {
        turnCompleted: {
          matchID: match.id,
          seq: i,
          channel: 'council',
          kind: 'dialogue',
        },
      },
    })
  })
  events.push({
    at: 15000,
    event: { matchFinished: { matchID: match.id, winner: 'b' } },
  })
  return events
}
function detail(match: StoredMatch): MatchDetail {
  const ownName =
    roleOfOptions(scenarioModule(scenario.summary.id), match.version.options)
      ?.name ?? '细川藤孝'
  const elapsed = Date.now() - match.startedAt
  const finished = elapsed >= 15000
  const turns: TurnDTO[] = lines.flatMap(([speaker, text], i) =>
    elapsed >= 2500 + i * 2300
      ? [{
        seq: i,
        channel: 'council',
        kind: 'dialogue' as const,
        speaker,
        finalText: text,
        reasoning: null,
      }]
      : []
  )
  return {
    summary: {
      id: match.id,
      scenarioID: scenario.summary.id,
      scenarioTitle: scenario.summary.title,
      kind: 'pve',
      dispatched: true,
      finished,
      scored: finished,
      winner: finished ? 'b' : null,
      createdAt: match.startedAt / 1000,
      finishedAt: finished ? (match.startedAt + 15000) / 1000 : null,
      initiatorIsMe: true,
      participants: {
        a: {
          presetKey: 'chosokabe-standard',
          ownerDisplayName: '预设对手',
          modelID: 'kimi-k2.6',
          isMine: false,
        },
        b: {
          agentID: 101,
          versionID: match.version.id,
          ownerDisplayName: '演示选手',
          modelID: match.version.modelID,
          isMine: true,
        },
      },
    },
    currentTurn: turns.length,
    turns,
    verdicts: [],
    scoreA: finished ? 1 : null,
    scoreB: finished ? 3 : null,
    reasoning: finished
      ? `${ownName}抓住盟约兑现与军令风险，促使光秀暂缓夜袭。`
      : null,
    stages: [{
      id: 'council',
      title: '军议',
      channels: [{ id: 'council', label: '阵中议事' }],
    }],
    speakerLabels: { a: '长宗我部元亲的密使', b: ownName, npc: '明智光秀' },
  }
}
export function streamMatch(
  id: number,
  afterTurn: number,
  signal: AbortSignal,
) {
  const match = store.matches.find((m) => m.id === id)
  if (!match) return null
  const encode = new TextEncoder()
  let closed = false
  let abortListener: (() => void) | undefined
  let timers: ReturnType<typeof setTimeout>[] = []
  const cleanup = () => {
    timers.forEach(clearTimeout)
    timers = []
    if (abortListener) signal.removeEventListener('abort', abortListener)
  }
  return new ReadableStream<Uint8Array>({
    start(controller) {
      const close = () => {
        if (closed) return
        closed = true
        cleanup()
        controller.close()
      }
      abortListener = close
      signal.addEventListener('abort', close, { once: true })
      if (signal.aborted) {
        close()
        return
      }
      const now = Date.now()
      for (const { at, event } of timeline(match)) {
        // Only emit future deltas. Historical rows come from the detail request.
        if (
          'chunk' in event &&
          (event.chunk.seq <= afterTurn || match.startedAt + at < now)
        ) continue
        if (
          'turnCompleted' in event &&
          (event.turnCompleted.seq <= afterTurn || match.startedAt + at < now)
        ) continue
        timers.push(setTimeout(() => {
          if (closed) return
          controller.enqueue(
            encode.encode(`data: ${JSON.stringify(event)}\n\n`),
          )
          if ('matchFinished' in event) close()
        }, Math.max(20, match.startedAt + at - now)))
      }
    },
    cancel() {
      closed = true
      cleanup()
    },
  })
}
export function respond(
  path: string,
  method = 'GET',
  body: Record<string, unknown> = {},
) {
  const url = new URL(path, 'http://demo.local')
  const pathname = url.pathname
  if (pathname === '/v1/matches/pve' && method === 'POST') {
    const result = base('/v1/agents/101/versions').body as {
      versions: AgentVersionDTO[]
    }
    const version = result.versions.find((v) => v.id === body.versionID)
    if (!version || body.presetKey !== 'chosokabe-standard') {
      return { status: 400, body: { message: '请选择出战版本和对手。' } }
    }
    const match = {
      id: 7001 + store.matches.length,
      startedAt: Date.now(),
      version: structuredClone(version),
    }
    store.matches.push(match)
    persist()
    return { body: { matchID: match.id } }
  }
  if (pathname === '/v1/matches') {
    return {
      body: {
        matches: store.matches.map((m) => detail(m).summary).reverse(),
        open: false,
      },
    }
  }
  const matchID = pathname.match(/^\/v1\/matches\/(\d+)$/)?.[1]
  if (matchID) {
    const match = store.matches.find((m) => m.id === Number(matchID))
    return match
      ? { body: detail(match) }
      : { status: 404, body: { message: '对局不存在。' } }
  }
  const rewardID = pathname.match(/^\/v1\/demo\/rewards\/(\d+)$/)?.[1]
  if (rewardID) {
    const id = Number(rewardID), match = store.matches.find((m) => m.id === id)
    if (!match || !detail(match).summary.finished) {
      return { status: 409, body: { message: '对局尚未获胜。' } }
    }
    const alreadyClaimed = store.claimed.includes(id)
    if (method === 'POST' && !alreadyClaimed) {
      store.claimed.push(id)
      store.balance += 120
      persist()
    }
    return {
      body: {
        claimed: store.claimed.includes(id),
        balance: store.balance,
        amount: 120,
        newlyClaimed: method === 'POST' && !alreadyClaimed,
      },
    }
  }
  if (pathname === '/v1/demo/reset' && method === 'POST') {
    store = { matches: [], claimed: [], balance: 1000 }
    persist()
    return { body: { ok: true } }
  }
  if (pathname === '/v1/agents/101/diff') {
    const versions =
      (base('/v1/agents/101/versions').body as { versions: AgentVersionDTO[] })
        .versions
    return {
      body: {
        base: versions.find((v) =>
          v.id === Number(url.searchParams.get('base'))
        ),
        head: versions.find((v) =>
          v.id === Number(url.searchParams.get('head'))
        ),
      },
    }
  }
  return base(pathname, method, body)
}
