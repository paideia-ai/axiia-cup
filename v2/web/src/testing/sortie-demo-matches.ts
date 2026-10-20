// Local preview only. Produces the existing match-page contract without models,
// accounts, billing, or changes to production endpoints.
import type { MatchDetail, MatchParticipantDTO, TurnDTO } from '../api/types'
import {
  demoOpponents,
  sortieEntries,
  sortieVersionEntries,
} from '../features/sortie/fixtures'
import { portraitScenarios } from './agent-portrait-fixtures'

interface Run {
  matchID: number
  startedAt: number
  detail: MatchDetail
  turns: TurnDTO[]
}
const runs = new Map<number, Run>()
const requests = new Map<string, Run>()
let nextID = 9100
const duration = 4500

function detail(run: Run): MatchDetail {
  const elapsed = Date.now() - run.startedAt
  const finished = elapsed >= duration
  const count = Math.min(run.turns.length, Math.floor(elapsed / 1500))
  return {
    ...run.detail,
    summary: {
      ...run.detail.summary,
      finished,
      scored: finished,
      winner: finished ? run.detail.summary.winner : null,
      finishedAt: finished ? (run.startedAt + duration) / 1000 : null,
    },
    currentTurn: count,
    turns: run.turns.slice(0, count),
    reasoning: finished
      ? '本地模拟结果，用于演示出战流程，不代表模型的实际表现。'
      : null,
  }
}

export async function sortieMatchAPI(
  request: Request,
  path: string,
): Promise<Response | null> {
  if (request.method === 'POST' && path === '/demo/ladder/matches') {
    let input
    try {
      input = await request.json()
    } catch {
      return Response.json({ error: 'invalid_json' }, { status: 400 })
    }
    if (
      !input || typeof input.requestID !== 'string' ||
      input.requestID.length > 100 ||
      !['win', 'loss', 'draw'].includes(input.outcome)
    ) {
      return Response.json({ error: 'invalid_request' }, { status: 400 })
    }
    const previous = requests.get(input.requestID)
    if (previous) {
      return Response.json({
        matchID: previous.matchID,
        startedAt: previous.startedAt,
      })
    }
    const own = sortieVersionEntries.find((e) =>
      e.versionID === input.versionID
    )
    const opponent = demoOpponents.find((e) =>
      e.versionID === input.opponentVersionID
    )
    if (
      !own || !opponent || own.scenarioID !== opponent.scenarioID ||
      own.side === opponent.side
    ) {
      return Response.json({ error: 'invalid_opponent' }, { status: 400 })
    }
    const other = sortieEntries.find((e) =>
      e.scenarioID === own.scenarioID && e.side === opponent.side
    )!
    const scenario = portraitScenarios.find((s) =>
      s.summary.id === own.scenarioID
    )!
    const participant = (
      entry: typeof own,
      mine: boolean,
    ): MatchParticipantDTO => ({
      role: { key: entry.roleKey, name: entry.roleName, side: entry.side },
      versionID: mine ? own.versionID : opponent.versionID,
      ownerDisplayName: mine ? '你' : opponent.name,
      isMine: mine,
    })
    const winner = input.outcome === 'draw'
      ? null
      : input.outcome === 'win'
      ? own.side
      : other.side
    const channel = 'demo-dialogue'
    const run: Run = {
      matchID: nextID++,
      startedAt: Date.now(),
      detail: {
        summary: {
          id: nextID - 1,
          scenarioID: own.scenarioID,
          scenarioTitle: `${scenario.summary.title} · 本地演示`,
          kind: 'pvp',
          dispatched: true,
          finished: false,
          scored: false,
          winner,
          initiatorIsMe: true,
          createdAt: Date.now() / 1000,
          participants: own.side === 'a'
            ? { a: participant(own, true), b: participant(other, false) }
            : { a: participant(other, false), b: participant(own, true) },
        },
        currentTurn: 0,
        turns: [],
        verdicts: [],
        stages: [{
          id: 'demo',
          title: '模拟交锋',
          channels: [{ id: channel, label: '本地演示' }],
        }],
        speakerLabels: {
          a: scenario.summary.sideAName,
          b: scenario.summary.sideBName,
        },
      },
      turns: [
        {
          seq: 0,
          channel,
          kind: 'dialogue',
          speaker: own.roleKey,
          finalText: '【本地模拟】我将先陈述自己的立场，再回应对方的质疑。',
        },
        {
          seq: 1,
          channel,
          kind: 'dialogue',
          speaker: other.roleKey,
          finalText: '【本地模拟】我会提出不同的判断，并说明其中的理由。',
        },
        {
          seq: 2,
          channel,
          kind: 'dialogue',
          speaker: own.roleKey,
          finalText:
            '【本地模拟】双方已经完成交锋。本段仅用于预览对战页，不调用模型。',
        },
      ],
    }
    runs.set(run.matchID, run)
    requests.set(input.requestID, run)
    return Response.json({ matchID: run.matchID, startedAt: run.startedAt })
  }
  // Keep the other fixture screens unchanged; only explicitly opened demo runs
  // are exposed. This is not a fake history feed for the rest of the application.
  const found = /^\/matches\/(\d+)(?:\/(stream|view))?$/.exec(path)
  if (!found) return null
  const run = runs.get(Number(found[1]))
  if (!run) return null
  if (found[2] === 'view' && request.method === 'POST') {
    return Response.json({ ok: true })
  }
  if (request.method !== 'GET') return null
  if (!found[2]) return Response.json(detail(run))
  if (found[2] !== 'stream') return null
  let timer: ReturnType<typeof setInterval> | undefined
  const stream = new ReadableStream<Uint8Array>({
    start(controller) {
      const encoder = new TextEncoder()
      let after = Number(
        new URL(request.url).searchParams.get('afterTurn') ?? -1,
      )
      const tick = () => {
        const current = detail(run)
        for (const turn of current.turns.filter((t) => t.seq > after)) {
          controller.enqueue(
            encoder.encode(
              `data: ${
                JSON.stringify({
                  turnCompleted: {
                    matchID: run.matchID,
                    seq: turn.seq,
                    channel: turn.channel,
                    kind: turn.kind,
                  },
                })
              }\n\n`,
            ),
          )
          after = turn.seq
        }
        if (current.summary.finished) {
          controller.enqueue(
            encoder.encode(
              `data: ${
                JSON.stringify({
                  matchFinished: {
                    matchID: run.matchID,
                    winner: current.summary.winner ?? '',
                  },
                })
              }\n\n`,
            ),
          )
          clearInterval(timer)
          controller.close()
        }
      }
      timer = setInterval(tick, 250)
      tick()
    },
    cancel() {
      clearInterval(timer)
    },
  })
  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-store',
    },
  })
}
